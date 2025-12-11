import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquare, Users, Plus, Database, Code, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch user stats
  const [agents, conversations, totalMessages, knowledgeCount, recentConversations] = await Promise.all([
    prisma.agent.count({ where: { userId: session.user.id } }),
    prisma.conversation.count({
      where: { agent: { userId: session.user.id } },
    }),
    prisma.message.count({
      where: { conversation: { agent: { userId: session.user.id } } },
    }),
    prisma.knowledgeBase.count({
      where: { agent: { userId: session.user.id } },
    }),
    prisma.conversation.findMany({
      where: { agent: { userId: session.user.id } },
      include: {
        agent: { select: { name: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    {
      name: "エージェント数",
      value: agents,
      icon: Bot,
      href: "/dashboard/agents",
    },
    {
      name: "総会話数",
      value: conversations,
      icon: MessageSquare,
      href: "/dashboard/conversations",
    },
    {
      name: "総メッセージ数",
      value: totalMessages,
      icon: Users,
      href: "/dashboard/analytics",
    },
    {
      name: "ナレッジ数",
      value: knowledgeCount,
      icon: Database,
      href: "/dashboard/agents",
    },
  ];

  const quickActions = [
    {
      label: "エージェント作成",
      description: "新しいAIエージェントを作成",
      href: "/dashboard/agents/new",
      icon: Plus,
      variant: "default" as const,
    },
    {
      label: "ナレッジ追加",
      description: "AIに学習データを追加",
      href: "/dashboard/agents",
      icon: Database,
      variant: "outline" as const,
    },
    {
      label: "ウィジェット設定",
      description: "埋め込みコードを取得",
      href: "/dashboard/widget",
      icon: Code,
      variant: "outline" as const,
    },
    {
      label: "会話を確認",
      description: "最近の会話履歴を表示",
      href: "/dashboard/conversations",
      icon: MessageSquare,
      variant: "outline" as const,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            こんにちは、{session.user.name || "ユーザー"}さん
          </h1>
          <p className="text-muted-foreground mt-1">
            今日もAIエージェントがあなたの代わりに接客中です
          </p>
        </div>
        <Link href="/dashboard/agents/new">
          <Button>
            <Bot className="mr-2 h-4 w-4" />
            新規エージェント作成
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">クイックアクション</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <action.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{action.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {recentConversations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">最近のアクティビティ</h2>
            <Link href="/dashboard/conversations">
              <Button variant="ghost" size="sm">
                すべて表示
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentConversations.map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/dashboard/conversations/${conv.id}`}
                    className="block hover:bg-accent/50 transition-colors"
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            セッション: {conv.sessionId?.slice(0, 8) || "匿名"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {conv.agent.name} • {conv._count.messages} メッセージ
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(conv.updatedAt), {
                          addSuffix: true,
                          locale: ja,
                        })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick actions */}
      {agents === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              まだエージェントがありません
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              あなたのECサイトのURLを入力するだけで、
              AIが自動で商品情報を学習し、接客を始めます
            </p>
            <Link href="/dashboard/agents/new">
              <Button size="lg">
                最初のエージェントを作成
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
