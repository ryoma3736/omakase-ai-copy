"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Globe, Wand2, Code, Loader2, Check, Copy } from "lucide-react";

type Step = "url" | "settings" | "embed";

const toneOptions = [
  { value: "formal", label: "丁寧", description: "敬語を使った丁寧な対応" },
  { value: "friendly", label: "フレンドリー", description: "親しみやすい対応" },
  { value: "professional", label: "専門的", description: "専門知識を活かした対応" },
  { value: "casual", label: "カジュアル", description: "リラックスした対応" },
];

export default function NewAgentPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("url");
  const [isLoading, setIsLoading] = useState(false);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("friendly");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "こんにちは！何かお探しですか？"
  );

  const handleUrlSubmit = () => {
    if (!url) return;

    // Auto-generate name from URL
    try {
      const urlObj = new URL(url);
      setName(urlObj.hostname.replace("www.", ""));
    } catch {
      setName(url);
    }

    setStep("settings");
  };

  const handleCreateAgent = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          websiteUrl: url,
          description,
          personality: {
            tone,
            formalityLevel: tone === "formal" ? 8 : tone === "casual" ? 3 : 5,
            emojiUsage: tone === "friendly" ? 5 : tone === "casual" ? 7 : 2,
            greetingMessage: welcomeMessage,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to create agent");

      const agent = await response.json();
      setCreatedAgentId(agent.id);
      setStep("embed");
    } catch (error) {
      console.error("Failed to create agent:", error);
      alert("エージェントの作成に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const embedCode = `<script src="${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}/widget.js"></script>
<script>
  OmakaseWidget.init({
    agentId: "${createdAgentId || "YOUR_AGENT_ID"}",
    position: "bottom-right",
    theme: "light"
  });
</script>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {["url", "settings", "embed"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : s === "url" || (s === "settings" && step !== "url") || step === "embed"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && (
              <div
                className={`w-12 h-0.5 ${
                  (s === "url" && step !== "url") ||
                  (s === "settings" && step === "embed")
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: URL Input */}
      {step === "url" && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>サイトURLを入力</CardTitle>
            <CardDescription>
              AIがサイトを解析し、商品情報を自動で学習します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="url"
              placeholder="https://your-shop.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-lg h-12"
            />
            <Button
              className="w-full h-12"
              onClick={handleUrlSubmit}
              disabled={!url}
            >
              サイトを解析する
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Settings */}
      {step === "settings" && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Wand2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>エージェントを設定</CardTitle>
            <CardDescription>
              エージェントの名前と性格を設定しましょう
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">エージェント名</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: マイショップアシスタント"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">説明（オプション）</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="このエージェントの役割を説明してください"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">口調</label>
              <div className="grid grid-cols-2 gap-3">
                {toneOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTone(option.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      tone === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ウェルカムメッセージ</label>
              <Textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="最初の挨拶メッセージ"
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("url")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                戻る
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateAgent}
                disabled={!name || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    作成中...
                  </>
                ) : (
                  <>
                    エージェントを作成
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Embed Code */}
      {step === "embed" && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>エージェント作成完了！</CardTitle>
            <CardDescription>
              以下のコードをサイトに貼り付けてください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                <code>{embedCode}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={copyEmbedCode}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push(`/dashboard/agents/${createdAgentId}`)}
              >
                エージェント詳細へ
              </Button>
              <Button
                className="flex-1"
                onClick={() => router.push("/dashboard/agents")}
              >
                ダッシュボードへ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
