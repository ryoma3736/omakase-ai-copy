"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Globe,
  FileText,
  Trash2,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface KnowledgeBasePageProps {
  params: Promise<{ id: string }>;
}

interface KnowledgeEntry {
  id: string;
  type: "URL" | "PDF" | "CSV" | "TEXT" | "MARKDOWN";
  title: string;
  content: string;
  status: "PENDING" | "PROCESSING" | "READY" | "ERROR";
  metadata: { url?: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface AgentData {
  id: string;
  name: string;
}

const statusConfig: Record<string, {
  label: string;
  icon: typeof Clock;
  color: string;
  bgColor: string;
  animate?: boolean;
}> = {
  PENDING: {
    label: "待機中",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  PROCESSING: {
    label: "処理中",
    icon: Loader2,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    animate: true,
  },
  READY: {
    label: "完了",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  ERROR: {
    label: "エラー",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
};

const typeConfig = {
  URL: { label: "URL", icon: Globe },
  PDF: { label: "PDF", icon: FileText },
  CSV: { label: "CSV", icon: FileText },
  TEXT: { label: "テキスト", icon: FileText },
  MARKDOWN: { label: "Markdown", icon: FileText },
};

export default function KnowledgeBasePage({ params }: KnowledgeBasePageProps) {
  const { id: agentId } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [isAddingText, setIsAddingText] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [agentRes, knowledgeRes] = await Promise.all([
        fetch(`/api/agents/${agentId}`),
        fetch(`/api/agents/${agentId}/knowledge`),
      ]);

      if (!agentRes.ok) throw new Error("Failed to fetch agent");

      const agentData = await agentRes.json();
      setAgent(agentData);

      if (knowledgeRes.ok) {
        const knowledgeData = await knowledgeRes.json();
        setEntries(knowledgeData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      router.push("/dashboard/agents");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [agentId, router]);

  const handleAddUrl = async () => {
    if (!newUrl) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/agents/${agentId}/knowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "URL",
          title: newTitle || new URL(newUrl).hostname,
          url: newUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to add URL");

      const newEntry = await response.json();
      setEntries([newEntry, ...entries]);
      setNewUrl("");
      setNewTitle("");
      setIsAddingUrl(false);
    } catch (error) {
      console.error("Failed to add URL:", error);
      alert("URLの追加に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddText = async () => {
    if (!newContent || !newTitle) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/agents/${agentId}/knowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "TEXT",
          title: newTitle,
          content: newContent,
        }),
      });

      if (!response.ok) throw new Error("Failed to add text");

      const newEntry = await response.json();
      setEntries([newEntry, ...entries]);
      setNewTitle("");
      setNewContent("");
      setIsAddingText(false);
    } catch (error) {
      console.error("Failed to add text:", error);
      alert("テキストの追加に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm("このナレッジを削除しますか？")) return;

    setDeletingId(entryId);
    try {
      const response = await fetch(
        `/api/agents/${agentId}/knowledge/${entryId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete");

      setEntries(entries.filter((e) => e.id !== entryId));
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/agents/${agentId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">ナレッジベース</h1>
            <p className="text-muted-foreground">{agent?.name}の学習データ</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>

          {/* Add URL Dialog */}
          <Dialog open={isAddingUrl} onOpenChange={setIsAddingUrl}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Globe className="h-4 w-4 mr-2" />
                URL追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>URLを追加</DialogTitle>
                <DialogDescription>
                  Webページの内容をナレッジベースに追加します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/products"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">タイトル（オプション）</Label>
                  <Input
                    id="title"
                    placeholder="商品ページ"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingUrl(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleAddUrl} disabled={!newUrl || isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "追加"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Text Dialog */}
          <Dialog open={isAddingText} onOpenChange={setIsAddingText}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                テキスト追加
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>テキストを追加</DialogTitle>
                <DialogDescription>
                  カスタムテキストをナレッジベースに追加します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="text-title">タイトル</Label>
                  <Input
                    id="text-title"
                    placeholder="FAQ、商品説明など"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">コンテンツ</Label>
                  <textarea
                    id="content"
                    className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="AIに学習させたい情報を入力してください"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingText(false)}>
                  キャンセル
                </Button>
                <Button
                  onClick={handleAddText}
                  disabled={!newTitle || !newContent || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "追加"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Knowledge List */}
      <Card>
        <CardHeader>
          <CardTitle>登録済みナレッジ</CardTitle>
          <CardDescription>
            {entries.length}件のナレッジが登録されています
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length > 0 ? (
            <div className="space-y-3">
              {entries.map((entry) => {
                const status = statusConfig[entry.status];
                const type = typeConfig[entry.type];
                const StatusIcon = status.icon;
                const TypeIcon = type.icon;

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${status.bgColor}`}>
                        <TypeIcon className={`h-5 w-5 ${status.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{entry.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {type.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <StatusIcon
                            className={`h-3 w-3 ${status.color} ${
                              status.animate ? "animate-spin" : ""
                            }`}
                          />
                          <span>{status.label}</span>
                          <span className="text-xs">
                            {new Date(entry.createdAt).toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                        {entry.type === "URL" && entry.metadata?.url && (
                          <a
                            href={String(entry.metadata.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {String(entry.metadata.url).slice(0, 50)}...
                          </a>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                    >
                      {deletingId === entry.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                ナレッジがありません
              </h3>
              <p className="text-muted-foreground mb-4">
                URLやテキストを追加して、AIに学習させましょう
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" onClick={() => setIsAddingUrl(true)}>
                  <Globe className="h-4 w-4 mr-2" />
                  URL追加
                </Button>
                <Button onClick={() => setIsAddingText(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  テキスト追加
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ナレッジベースについて</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            ナレッジベースは、AIエージェントが回答に使用する情報源です。
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>URL追加</strong>: Webページの内容を自動で取得・学習
            </li>
            <li>
              <strong>テキスト追加</strong>: FAQや商品説明などのカスタム情報
            </li>
            <li>
              <strong>ファイル</strong>: PDF、CSV、Markdownファイルをアップロード（準備中）
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
