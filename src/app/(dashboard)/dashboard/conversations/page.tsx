import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Clock, Bot, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

export default async function ConversationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const conversations = await prisma.conversation.findMany({
    where: { agent: { userId: session.user.id } },
    include: {
      agent: {
        select: { id: true, name: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">会話履歴</h1>
        <p className="text-muted-foreground">
          顧客とのすべての会話を確認できます
        </p>
      </div>

      {/* Conversation list */}
      {conversations.length > 0 ? (
        <div className="space-y-3">
          {conversations.map((conversation) => {
            const lastMessage = conversation.messages[0];
            return (
              <Link
                key={conversation.id}
                href={`/dashboard/conversations/${conversation.id}`}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {conversation.sessionId?.charAt(0) || "V"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              セッション: {conversation.sessionId?.slice(0, 8) || "匿名"}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              <Bot className="h-3 w-3 mr-1" />
                              {conversation.agent.name}
                            </Badge>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(
                              new Date(conversation.updatedAt),
                              { addSuffix: true, locale: ja }
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {lastMessage?.content || "メッセージなし"}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {conversation._count.messages} メッセージ
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">会話がありません</h3>
            <p className="text-muted-foreground text-center max-w-md">
              AIエージェントが顧客と会話すると、ここに履歴が表示されます
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
