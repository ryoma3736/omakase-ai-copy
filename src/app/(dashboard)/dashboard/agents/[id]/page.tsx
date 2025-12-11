import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Settings,
  MessageSquare,
  Package,
  BarChart3,
  ExternalLink,
  Copy,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { ExportDialog } from "@/components/dashboard/export-dialog";

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const agent = await prisma.agent.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      _count: {
        select: {
          conversations: true,
          products: true,
          knowledgeBase: true,
        },
      },
      products: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      conversations: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { messages: true } },
        },
      },
    },
  });

  if (!agent) {
    notFound();
  }

  const personality = (agent.personality as Record<string, unknown>) || {};
  const widgetConfig = (agent.widgetConfig as Record<string, unknown>) || {};

  const embedCode = `<script src="${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}/widget.js"></script>
<script>
  OmakaseWidget.init({
    agentId: "${agent.id}",
    position: "${widgetConfig.position || "bottom-right"}",
    theme: "${widgetConfig.theme || "light"}"
  });
</script>`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/agents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                <a
                  href={agent.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {agent.websiteUrl}
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={agent.isActive ? "success" : "secondary"}>
            {agent.isActive ? "稼働中" : "停止中"}
          </Badge>
          <ExportDialog agentId={agent.id} agentName={agent.name} />
          <Link href={`/dashboard/agents/${agent.id}/knowledge`}>
            <Button variant="outline">
              <BookOpen className="h-4 w-4 mr-2" />
              ナレッジ
            </Button>
          </Link>
          <Link href={`/dashboard/agents/${agent.id}/settings`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              設定
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agent._count.conversations}</p>
                <p className="text-xs text-muted-foreground">会話数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agent._count.products}</p>
                <p className="text-xs text-muted-foreground">登録商品</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agent._count.knowledgeBase}</p>
                <p className="text-xs text-muted-foreground">ナレッジ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bot className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold capitalize">
                  {(personality.tone as string) || "friendly"}
                </p>
                <p className="text-xs text-muted-foreground">トーン</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="conversations">会話</TabsTrigger>
          <TabsTrigger value="products">商品</TabsTrigger>
          <TabsTrigger value="embed">埋め込み</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">説明</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {agent.description || "説明が設定されていません"}
                </p>
              </CardContent>
            </Card>

            {/* Personality */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">パーソナリティ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">トーン</span>
                  <span className="capitalize">
                    {(personality.tone as string) || "friendly"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">丁寧さ</span>
                  <span>{(personality.formalityLevel as number) || 5}/10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">絵文字使用</span>
                  <span>{(personality.emojiUsage as number) || 5}/10</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Welcome Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ウェルカムメッセージ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm bg-muted p-3 rounded-lg">
                {(personality.greetingMessage as string) ||
                  "こんにちは！何かお探しですか？"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">最近の会話</CardTitle>
              <CardDescription>
                直近5件の会話を表示しています
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agent.conversations.length > 0 ? (
                <div className="space-y-3">
                  {agent.conversations.map((conv) => (
                    <Link
                      key={conv.id}
                      href={`/dashboard/conversations/${conv.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              Session: {conv.sessionId.slice(0, 8)}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {conv._count.messages} メッセージ
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{conv.status}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  まだ会話がありません
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">登録商品</CardTitle>
              <CardDescription>
                AIが学習した商品情報
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agent.products.length > 0 ? (
                <div className="space-y-3">
                  {agent.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          {product.category && (
                            <p className="text-xs text-muted-foreground">
                              {product.category}
                            </p>
                          )}
                        </div>
                      </div>
                      {product.price && (
                        <span className="text-sm font-medium">
                          {product.currency === "JPY" ? "¥" : "$"}
                          {Number(product.price).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  商品が登録されていません
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">埋め込みコード</CardTitle>
              <CardDescription>
                このコードをサイトの&lt;/body&gt;タグの前に貼り付けてください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{embedCode}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => navigator.clipboard.writeText(embedCode)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
