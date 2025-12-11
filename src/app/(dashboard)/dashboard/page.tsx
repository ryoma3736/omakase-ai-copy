import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquare, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch user stats
  const [agents, conversations, totalMessages] = await Promise.all([
    prisma.agent.count({ where: { userId: session.user.id } }),
    prisma.conversation.count({
      where: { agent: { userId: session.user.id } },
    }),
    prisma.message.count({
      where: { conversation: { agent: { userId: session.user.id } } },
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
      name: "コンバージョン",
      value: "-",
      icon: TrendingUp,
      href: "/dashboard/analytics",
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
