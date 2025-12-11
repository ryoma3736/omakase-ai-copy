import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Bot, User, Clock, Calendar } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface ConversationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      agent: {
        select: { id: true, name: true, userId: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation || conversation.agent.userId !== session.user.id) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/conversations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">
              セッション: {conversation.sessionId?.slice(0, 8) || "匿名"}
            </h1>
            <Badge variant="outline">
              <Bot className="h-3 w-3 mr-1" />
              {conversation.agent.name}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(conversation.createdAt), "yyyy/MM/dd HH:mm", {
                locale: ja,
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(conversation.updatedAt), {
                addSuffix: true,
                locale: ja,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">会話内容</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {conversation.messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "USER" ? "flex-row-reverse" : ""
              }`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback
                  className={
                    message.role === "USER"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-primary/10 text-primary"
                  }
                >
                  {message.role === "USER" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div
                className={`flex flex-col max-w-[70%] ${
                  message.role === "USER" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    message.role === "USER"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {format(new Date(message.createdAt), "HH:mm", { locale: ja })}
                </span>
              </div>
            </div>
          ))}

          {conversation.messages.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              メッセージがありません
            </p>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      {conversation.metadata && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">メタデータ</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(conversation.metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
