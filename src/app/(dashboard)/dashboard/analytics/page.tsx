"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Users,
  TrendingUp,
  Activity,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";

export default function AnalyticsPage() {
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds default
  const { analytics, isLoading, isError, error, refresh, isRealTime } =
    useAnalytics(refreshInterval);

  const toggleRealTime = () => {
    setRefreshInterval((prev) => (prev > 0 ? 0 : 30000));
  };

  if (isLoading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">
          Error: {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const stats = [
    {
      name: "総会話数",
      value: analytics.totalConversations,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "総メッセージ数",
      value: analytics.totalMessages,
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "平均メッセージ数/会話",
      value: analytics.avgMessagesPerConversation.toFixed(1),
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      name: "コンバージョン率",
      value: `${analytics.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  // Calculate max for chart
  const maxConversations = Math.max(
    ...analytics.conversationsByDay.map((d) => d.count),
    1
  );

  return (
    <div className="space-y-6">
      {/* Header with Real-time controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">アナリティクス</h1>
          <p className="text-muted-foreground">
            エージェントのパフォーマンスを分析します
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            更新
          </Button>
          <Button
            variant={isRealTime ? "default" : "outline"}
            size="sm"
            onClick={toggleRealTime}
          >
            {isRealTime ? (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                リアルタイム ON
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 mr-2" />
                リアルタイム OFF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Conversations Chart */}
        <Card>
          <CardHeader>
            <CardTitle>会話数の推移</CardTitle>
            <CardDescription>過去30日間の会話数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-end gap-1">
              {analytics.conversationsByDay.map((day, i) => (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                    style={{
                      height: `${(day.count / maxConversations) * 100}%`,
                      minHeight: day.count > 0 ? "4px" : "0",
                    }}
                    title={`${day.date}: ${day.count}件`}
                  />
                  {i % 7 === 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {day.date.slice(5)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>メッセージ分布</CardTitle>
            <CardDescription>送信者別のメッセージ数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.messagesByRole.map((item) => {
                const total = analytics.messagesByRole.reduce(
                  (acc, i) => acc + i.count,
                  0
                );
                const percentage = total > 0 ? (item.count / total) * 100 : 0;
                return (
                  <div key={item.role} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Badge
                          variant={
                            item.role === "USER" ? "default" : "secondary"
                          }
                        >
                          {item.role === "USER" ? "ユーザー" : "AI"}
                        </Badge>
                      </span>
                      <span className="text-muted-foreground">
                        {item.count}件 ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          item.role === "USER" ? "bg-blue-500" : "bg-green-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Agents */}
      <Card>
        <CardHeader>
          <CardTitle>トップエージェント</CardTitle>
          <CardDescription>会話数が多いエージェント</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.topAgents.length > 0 ? (
            <div className="space-y-4">
              {analytics.topAgents.map((agent, i) => (
                <div
                  key={agent.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        i === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : i === 1
                          ? "bg-gray-100 text-gray-700"
                          : i === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className="font-medium">{agent.name}</span>
                  </div>
                  <Badge variant="outline">{agent.conversations} 会話</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              データがありません
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
