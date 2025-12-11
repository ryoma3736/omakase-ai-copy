import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchPage, extractProducts } from "@/lib/scraper";
import { getDefaultPersonality } from "@/lib/prompt-generator";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agents = await prisma.agent.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { conversations: true, products: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(agents);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, websiteUrl, description, personality } = body;

    if (!name || !websiteUrl) {
      return NextResponse.json(
        { error: "Name and website URL are required" },
        { status: 400 }
      );
    }

    // Create agent
    const agent = await prisma.agent.create({
      data: {
        name,
        websiteUrl,
        description,
        personality: personality || getDefaultPersonality(),
        userId: session.user.id,
      },
    });

    // Start background scraping (in production, use a queue)
    scrapeAndStoreProducts(agent.id, websiteUrl).catch(console.error);

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error("Failed to create agent:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}

async function scrapeAndStoreProducts(agentId: string, websiteUrl: string) {
  try {
    // Fetch and parse the main page
    const page = await fetchPage(websiteUrl);

    // Store page content as knowledge base
    await prisma.knowledgeBase.create({
      data: {
        agentId,
        type: "URL",
        title: page.title || websiteUrl,
        content: `URL: ${page.url}\n\nタイトル: ${page.title}\n\n説明: ${page.description}\n\n内容:\n${page.content}`,
        status: "READY",
        metadata: page.metadata,
      },
    });

    // Extract products using AI
    const products = await extractProducts(page);

    // Store products
    for (const product of products) {
      await prisma.product.create({
        data: {
          agentId,
          name: product.name,
          price: product.price,
          currency: product.currency || "JPY",
          description: product.description,
          imageUrl: product.imageUrl,
          category: product.category,
          features: product.features || [],
        },
      });
    }

    console.log(
      `Scraped ${products.length} products for agent ${agentId}`
    );
  } catch (error) {
    console.error(`Failed to scrape products for agent ${agentId}:`, error);
  }
}
