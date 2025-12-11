"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Copy, Check, Loader2, Eye, Settings, Palette } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  isActive: boolean;
}

interface WidgetConfig {
  agentId: string;
  primaryColor: string;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  buttonText: string;
  welcomeMessage: string;
  showBranding: boolean;
  theme: "light" | "dark" | "auto";
}

const defaultConfig: WidgetConfig = {
  agentId: "",
  primaryColor: "#000000",
  position: "bottom-right",
  buttonText: "チャットを開く",
  welcomeMessage: "こんにちは！何かお探しですか？",
  showBranding: true,
  theme: "light",
};

export default function WidgetCustomizerPage() {
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents");
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
        if (data.length > 0) {
          setConfig((prev) => ({ ...prev, agentId: data[0].id }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = <K extends keyof WidgetConfig>(
    key: K,
    value: WidgetConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const generateEmbedCode = () => {
    const scriptUrl = `${window.location.origin}/widget.js`;
    return `<script>
  window.omakaseConfig = {
    agentId: "${config.agentId}",
    primaryColor: "${config.primaryColor}",
    position: "${config.position}",
    buttonText: "${config.buttonText}",
    welcomeMessage: "${config.welcomeMessage}",
    showBranding: ${config.showBranding},
    theme: "${config.theme}"
  };
</script>
<script src="${scriptUrl}" async></script>`;
  };

  const generateScriptTag = () => {
    return `<script src="${window.location.origin}/widget.js?agent=${config.agentId}" async></script>`;
  };

  const copyToClipboard = async (text: string, type: "code" | "script") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "code") {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedScript(true);
        setTimeout(() => setCopiedScript(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const positionOptions = [
    { value: "bottom-right", label: "右下" },
    { value: "bottom-left", label: "左下" },
    { value: "top-right", label: "右上" },
    { value: "top-left", label: "左上" },
  ];

  const themeOptions = [
    { value: "light", label: "ライト" },
    { value: "dark", label: "ダーク" },
    { value: "auto", label: "自動" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">ウィジェット設定</h1>
          <p className="text-muted-foreground">
            Webサイトに埋め込むチャットウィジェットをカスタマイズ
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Code className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              エージェントがありません
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              ウィジェットを作成する前に、まずエージェントを作成してください
            </p>
            <Link href="/dashboard/agents/new">
              <Button>エージェントを作成</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedAgent = agents.find((a) => a.id === config.agentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">ウィジェット設定</h1>
        <p className="text-muted-foreground">
          Webサイトに埋め込むチャットウィジェットをカスタマイズ
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                基本設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Agent Selection */}
              <div className="space-y-2">
                <Label htmlFor="agent">エージェント</Label>
                <select
                  id="agent"
                  value={config.agentId}
                  onChange={(e) => updateConfig("agentId", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}{" "}
                      {agent.isActive ? "✓" : "(停止中)"}
                    </option>
                  ))}
                </select>
                {selectedAgent && !selectedAgent.isActive && (
                  <p className="text-xs text-yellow-600">
                    このエージェントは現在停止中です
                  </p>
                )}
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position">表示位置</Label>
                <select
                  id="position"
                  value={config.position}
                  onChange={(e) =>
                    updateConfig(
                      "position",
                      e.target.value as WidgetConfig["position"]
                    )
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {positionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Theme */}
              <div className="space-y-2">
                <Label htmlFor="theme">テーマ</Label>
                <select
                  id="theme"
                  value={config.theme}
                  onChange={(e) =>
                    updateConfig("theme", e.target.value as WidgetConfig["theme"])
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {themeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show Branding */}
              <div className="flex items-center justify-between">
                <Label htmlFor="branding" className="cursor-pointer">
                  「Powered by Omakase AI」を表示
                </Label>
                <Switch
                  id="branding"
                  checked={config.showBranding}
                  onCheckedChange={(checked) =>
                    updateConfig("showBranding", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                デザイン
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Color */}
              <div className="space-y-2">
                <Label htmlFor="color">プライマリカラー</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => updateConfig("primaryColor", e.target.value)}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => updateConfig("primaryColor", e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Button Text */}
              <div className="space-y-2">
                <Label htmlFor="buttonText">ボタンテキスト</Label>
                <Input
                  id="buttonText"
                  value={config.buttonText}
                  onChange={(e) => updateConfig("buttonText", e.target.value)}
                  placeholder="チャットを開く"
                />
              </div>

              {/* Welcome Message */}
              <div className="space-y-2">
                <Label htmlFor="welcome">ウェルカムメッセージ</Label>
                <Input
                  id="welcome"
                  value={config.welcomeMessage}
                  onChange={(e) => updateConfig("welcomeMessage", e.target.value)}
                  placeholder="こんにちは！何かお探しですか？"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Embed Code Panel */}
        <div className="space-y-6">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                プレビュー
              </CardTitle>
              <CardDescription>
                実際のWebサイトでの表示イメージ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border-2 border-dashed overflow-hidden">
                {/* Preview Content */}
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                  <div className="text-center">
                    <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>ウィジェットプレビュー</p>
                    <p className="text-xs mt-1">
                      実際のウィジェットはWebサイトに埋め込まれます
                    </p>
                  </div>
                </div>

                {/* Widget Button Preview */}
                <div
                  className={`absolute ${
                    config.position === "bottom-right"
                      ? "bottom-4 right-4"
                      : config.position === "bottom-left"
                      ? "bottom-4 left-4"
                      : config.position === "top-right"
                      ? "top-4 right-4"
                      : "top-4 left-4"
                  }`}
                >
                  <button
                    style={{ backgroundColor: config.primaryColor }}
                    className="px-4 py-3 rounded-full shadow-lg text-white font-medium text-sm hover:opacity-90 transition-opacity"
                  >
                    {config.buttonText}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Embed Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                埋め込みコード
              </CardTitle>
              <CardDescription>
                WebサイトのHTML内に以下のコードを貼り付けてください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="full">フルコード</TabsTrigger>
                  <TabsTrigger value="simple">シンプル</TabsTrigger>
                </TabsList>
                <TabsContent value="full" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">
                        カスタム設定付き
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(generateEmbedCode(), "code")}
                      >
                        {copiedCode ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            コピー済み
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            コピー
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto">
                      <code>{generateEmbedCode()}</code>
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value="simple" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">
                        最小構成
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(generateScriptTag(), "script")
                        }
                      >
                        {copiedScript ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            コピー済み
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            コピー
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto">
                      <code>{generateScriptTag()}</code>
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">
                  <strong>設置方法:</strong> &lt;/body&gt; タグの直前に上記のコードを貼り付けてください。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
