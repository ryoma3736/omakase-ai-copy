import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, MessageSquare, Package, ExternalLink } from "lucide-react";

export default async function AgentsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">エージェント管理</h1>
          <p className="text-muted-foreground">
            AIエージェントの作成・管理を行います
          </p>
        </div>
        <Link href="/dashboard/agents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Button>
        </Link>
      </div>

      {/* Agent grid */}
      {agents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/dashboard/agents/${agent.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <ExternalLink className="h-3 w-3" />
                          <span className="truncate max-w-[180px]">
                            {agent.websiteUrl}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={agent.isActive ? "success" : "secondary"}>
                      {agent.isActive ? "稼働中" : "停止中"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {agent.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {agent.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{agent._count.conversations} 会話</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      <span>{agent._count.products} 商品</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              エージェントがありません
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              URLを入力するだけで、AIがサイトを学習し、
              自動で接客を始めます
            </p>
            <Link href="/dashboard/agents/new">
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                最初のエージェントを作成
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
