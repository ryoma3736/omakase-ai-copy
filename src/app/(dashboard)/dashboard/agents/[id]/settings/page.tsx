"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Bot,
  Palette,
  MessageSquare,
  Save,
  Loader2,
  Trash2,
} from "lucide-react";

interface AgentSettingsPageProps {
  params: Promise<{ id: string }>;
}

interface AgentData {
  id: string;
  name: string;
  websiteUrl: string;
  description: string | null;
  isActive: boolean;
  personality: {
    tone?: string;
    formalityLevel?: number;
    emojiUsage?: number;
    greetingMessage?: string;
    customInstructions?: string;
  } | null;
  widgetConfig: {
    primaryColor?: string;
    position?: "bottom-left" | "bottom-right";
    theme?: "light" | "dark";
    welcomeMessage?: string;
    avatarUrl?: string;
  } | null;
}

const toneOptions = [
  { value: "formal", label: "丁寧", description: "敬語を使った丁寧な対応" },
  { value: "friendly", label: "フレンドリー", description: "親しみやすい対応" },
  { value: "professional", label: "専門的", description: "専門知識を活かした対応" },
  { value: "casual", label: "カジュアル", description: "リラックスした対応" },
];

export default function AgentSettingsPage({ params }: AgentSettingsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Personality state
  const [tone, setTone] = useState("friendly");
  const [formalityLevel, setFormalityLevel] = useState(5);
  const [emojiUsage, setEmojiUsage] = useState(5);
  const [greetingMessage, setGreetingMessage] = useState("こんにちは！何かお探しですか？");
  const [customInstructions, setCustomInstructions] = useState("");

  // Widget state
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [position, setPosition] = useState<"bottom-left" | "bottom-right">("bottom-right");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [welcomeMessage, setWelcomeMessage] = useState("");

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await fetch(`/api/agents/${id}`);
        if (!response.ok) throw new Error("Failed to fetch agent");

        const agent: AgentData = await response.json();

        setName(agent.name);
        setWebsiteUrl(agent.websiteUrl);
        setDescription(agent.description || "");
        setIsActive(agent.isActive);

        if (agent.personality) {
          setTone(agent.personality.tone || "friendly");
          setFormalityLevel(agent.personality.formalityLevel || 5);
          setEmojiUsage(agent.personality.emojiUsage || 5);
          setGreetingMessage(agent.personality.greetingMessage || "こんにちは！何かお探しですか？");
          setCustomInstructions(agent.personality.customInstructions || "");
        }

        if (agent.widgetConfig) {
          setPrimaryColor(agent.widgetConfig.primaryColor || "#3B82F6");
          setPosition(agent.widgetConfig.position || "bottom-right");
          setTheme(agent.widgetConfig.theme || "light");
          setWelcomeMessage(agent.widgetConfig.welcomeMessage || "");
        }
      } catch (error) {
        console.error("Failed to fetch agent:", error);
        router.push("/dashboard/agents");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgent();
  }, [id, router]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          websiteUrl,
          description: description || null,
          isActive,
          personality: {
            tone,
            formalityLevel,
            emojiUsage,
            greetingMessage,
            customInstructions: customInstructions || null,
          },
          widgetConfig: {
            primaryColor,
            position,
            theme,
            welcomeMessage: welcomeMessage || null,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to save agent");

      router.push(`/dashboard/agents/${id}`);
    } catch (error) {
      console.error("Failed to save agent:", error);
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("本当にこのエージェントを削除しますか？この操作は取り消せません。")) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete agent");

      router.push("/dashboard/agents");
    } catch (error) {
      console.error("Failed to delete agent:", error);
      alert("削除に失敗しました");
    } finally {
      setIsDeleting(false);
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
          <Link href={`/dashboard/agents/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">エージェント設定</h1>
            <p className="text-muted-foreground">{name}の詳細設定を管理</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                削除
              </>
            )}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">
            <Bot className="h-4 w-4 mr-2" />
            基本情報
          </TabsTrigger>
          <TabsTrigger value="personality">
            <MessageSquare className="h-4 w-4 mr-2" />
            パーソナリティ
          </TabsTrigger>
          <TabsTrigger value="widget">
            <Palette className="h-4 w-4 mr-2" />
            外観
          </TabsTrigger>
        </TabsList>

        {/* Basic Settings */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>
                エージェントの基本的な情報を設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">エージェント名</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="マイショップアシスタント"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">ウェブサイトURL</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="このエージェントの役割を説明してください"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>エージェントの状態</Label>
                  <p className="text-sm text-muted-foreground">
                    オフにするとウィジェットが表示されなくなります
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personality Settings */}
        <TabsContent value="personality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>パーソナリティ設定</CardTitle>
              <CardDescription>
                AIの応答スタイルをカスタマイズします
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>口調</Label>
                <div className="grid grid-cols-2 gap-3">
                  {toneOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
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

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>丁寧さレベル</Label>
                  <span className="text-sm text-muted-foreground">{formalityLevel}/10</span>
                </div>
                <Slider
                  value={[formalityLevel]}
                  onValueChange={(v) => setFormalityLevel(v[0])}
                  min={1}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  低い: カジュアル、高い: フォーマル
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>絵文字使用頻度</Label>
                  <span className="text-sm text-muted-foreground">{emojiUsage}/10</span>
                </div>
                <Slider
                  value={[emojiUsage]}
                  onValueChange={(v) => setEmojiUsage(v[0])}
                  min={0}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  0: 使用しない、10: 頻繁に使用
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="greetingMessage">ウェルカムメッセージ</Label>
                <Textarea
                  id="greetingMessage"
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  placeholder="最初の挨拶メッセージ"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customInstructions">カスタム指示</Label>
                <Textarea
                  id="customInstructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="AIへの追加指示（例: 商品の特徴を簡潔に説明する、予算を必ず確認する など）"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  AIの振る舞いを細かくカスタマイズするための追加指示
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Widget Appearance */}
        <TabsContent value="widget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ウィジェット外観</CardTitle>
              <CardDescription>
                チャットウィジェットの見た目をカスタマイズします
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">プライマリカラー</Label>
                <div className="flex gap-3">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>ウィジェット位置</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPosition("bottom-left")}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      position === "bottom-left"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="font-medium">左下</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      画面左下に配置
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition("bottom-right")}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      position === "bottom-right"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="font-medium">右下</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      画面右下に配置
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>テーマ</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      theme === "light"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="font-medium">ライト</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      明るい背景
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      theme === "dark"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="font-medium">ダーク</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      暗い背景
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">ウィジェットメッセージ</Label>
                <Textarea
                  id="welcomeMessage"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="ウィジェットを開く前に表示されるメッセージ（例: お気軽にご質問ください！）"
                  rows={2}
                />
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>プレビュー</Label>
                <div className="border rounded-lg p-6 bg-muted/50 relative min-h-[200px]">
                  <div
                    className={`absolute ${
                      position === "bottom-left" ? "left-4" : "right-4"
                    } bottom-4`}
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    {welcomeMessage && (
                      <div
                        className={`absolute bottom-16 ${
                          position === "bottom-left" ? "left-0" : "right-0"
                        } bg-white shadow-lg rounded-lg p-3 text-sm max-w-[200px]`}
                      >
                        {welcomeMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
