"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Send, Volume2, VolumeX, ShoppingBag, Loader2 } from "lucide-react";

/**
 * Omakase AI Demo - チャット＆音声AIデモページ
 * 認証不要で直接AIと会話できる
 */
// 挨拶メッセージ
const GREETING = "こんにちは！おまかせAIです。商品のご質問やおすすめなど、何でもお気軽にどうぞ！";

export default function DemoPage() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: GREETING }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTTSGenerating, setIsTTSGenerating] = useState(false);
  const [lastAssistantMessage, setLastAssistantMessage] = useState(GREETING);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // 事前生成済み挨拶音声キャッシュ
  const greetingAudioRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 挨拶音声を事前生成（ページロード時）
  useEffect(() => {
    const preloadGreeting = async () => {
      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: GREETING, voice: "Kore" }),
        });
        const data = await response.json();
        if (data.success && data.audio) {
          greetingAudioRef.current = data.audio;
          console.log("Greeting audio preloaded");
        }
      } catch (error) {
        console.error("Failed to preload greeting:", error);
      }
    };
    preloadGreeting();
  }, []);

  // 無音タイマー
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef("");

  // 音声認識 - トグル方式（押すまで切れない）
  const toggleListening = useCallback(() => {
    // 既に認識中なら停止して送信
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("お使いのブラウザは音声認識に対応していません");
      return;
    }

    // TTS再生中は停止
    if (isSpeaking) {
      stopSpeaking();
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;

    finalTranscriptRef.current = "";

    recognition.onstart = () => setIsListening(true);

    recognition.onend = () => {
      // 入力があれば送信
      if (finalTranscriptRef.current.trim()) {
        setInput(finalTranscriptRef.current);
        setTimeout(() => {
          const sendBtn = document.querySelector('[data-send-btn]') as HTMLButtonElement;
          sendBtn?.click();
        }, 100);
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
      }

      setInput(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      // エラーでも勝手に切らない、ユーザーが停止ボタン押すまで継続
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech" && event.error !== "aborted") {
        // 致命的エラー以外は再開
        if (recognitionRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // 既に開始済みの場合は無視
          }
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, isSpeaking]);

  // 音声合成 (Gemini 2.5 TTS) - キャッシュ対応
  const speak = useCallback(async (text: string) => {
    setLastAssistantMessage(text);

    // 挨拶メッセージでキャッシュ済みなら即再生
    if (text === GREETING && greetingAudioRef.current) {
      setIsSpeaking(true);
      const audioBlob = new Blob(
        [Uint8Array.from(atob(greetingAudioRef.current), c => c.charCodeAt(0))],
        { type: "audio/wav" }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      await audio.play();
      return;
    }

    setIsTTSGenerating(true);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "Kore" }),
      });

      const data = await response.json();
      setIsTTSGenerating(false);

      if (data.success && data.audio) {
        setIsSpeaking(true);
        // Base64 audio を再生
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
          { type: data.mimeType || "audio/wav" }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          // フォールバック
          fallbackSpeak(text);
        };
        await audio.play();
      } else {
        fallbackSpeak(text);
      }
    } catch (error) {
      console.error("TTS error:", error);
      setIsTTSGenerating(false);
      fallbackSpeak(text);
    }
  }, []);

  // Web Speech API フォールバック
  const fallbackSpeak = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 1.1;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const stopSpeaking = () => {
    // Stop Gemini TTS audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Stop Web Speech API (fallback)
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // TTS音声キュー管理
  const audioQueueRef = useRef<{ audio: string; text: string }[]>([]);
  const isPlayingQueueRef = useRef(false);

  const playNextInQueue = useCallback(async () => {
    if (isPlayingQueueRef.current || audioQueueRef.current.length === 0) return;

    isPlayingQueueRef.current = true;
    const item = audioQueueRef.current.shift()!;

    try {
      setIsSpeaking(true);
      const audioBlob = new Blob(
        [Uint8Array.from(atob(item.audio), c => c.charCodeAt(0))],
        { type: "audio/wav" }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      await new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.play();
      });
    } catch (error) {
      console.error("Queue playback error:", error);
    }

    isPlayingQueueRef.current = false;

    // 次のキューを再生
    if (audioQueueRef.current.length > 0) {
      playNextInQueue();
    } else {
      setIsSpeaking(false);
      audioRef.current = null;
    }
  }, []);

  // ストリーミングでTTS生成して即座にキューに追加
  const generateAndQueueTTS = useCallback(async (text: string) => {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "Kore" }),
      });

      const data = await response.json();

      if (data.success && data.audio) {
        audioQueueRef.current.push({ audio: data.audio, text });
        // キューが空なら再生開始
        if (!isPlayingQueueRef.current) {
          playNextInQueue();
        }
      }
    } catch (error) {
      console.error("TTS queue error:", error);
    }
  }, [playNextInQueue]);

  // メッセージ送信（超高速統合API使用）
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setIsTTSGenerating(true);

    // キューをクリア
    audioQueueRef.current = [];

    // アシスタントメッセージを空で追加
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    const startTime = performance.now();

    try {
      // 統合Chat+TTS APIを使用（Chat応答とTTS生成が並列実行）
      const response = await fetch("/api/chat-with-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages.filter(m => m.role !== "assistant" || m.content !== ""),
          voice: "Kore",
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "text") {
              // 部分テキスト - UI表示を即座に更新
              fullResponse += data.text;
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { role: "assistant", content: fullResponse };
                return newMsgs;
              });
              console.log(`📝 Text received in ${data.elapsed}ms`);
            } else if (data.type === "audio") {
              // 音声データ - 即座に再生開始
              console.log(`🔊 Audio received in ${data.elapsed}ms`);
              setIsTTSGenerating(false);

              // 即座に再生
              setIsSpeaking(true);
              const audioBlob = new Blob(
                [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
                { type: data.mimeType || "audio/wav" }
              );
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);
              audioRef.current = audio;
              audio.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
              };
              audio.onerror = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
              };
              await audio.play();
            } else if (data.type === "done") {
              setLastAssistantMessage(data.fullText || fullResponse);
              const totalTime = performance.now() - startTime;
              console.log(`✅ Total response time: ${totalTime.toFixed(0)}ms (Server: ${data.totalElapsed}ms)`);
            } else if (data.type === "error") {
              console.error("Stream error:", data.message);
            }
          } catch (e) {
            // JSON parse error - skip
          }
        }
      }

      if (!fullResponse) {
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { role: "assistant", content: "申し訳ありません、エラーが発生しました。" };
          return newMsgs;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { role: "assistant", content: "接続エラーが発生しました。" };
        return newMsgs;
      });
    } finally {
      setIsLoading(false);
      setIsTTSGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // サンプル質問
  const sampleQuestions = [
    "おすすめの商品を教えて",
    "一番人気の商品は？",
    "予算1万円でプレゼントを探してる",
    "返品ポリシーを教えて",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Omakase AI Demo</h1>
              <p className="text-xs text-gray-400">Voice + Chat AI Agent</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Powered by Gemini
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="max-w-4xl mx-auto p-4 pb-32">
        {/* Sample Questions */}
        <div className="mb-6">
          <p className="text-gray-500 text-sm mb-2">クイック質問:</p>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => setInput(q)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 text-sm text-gray-300 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-cyan-500 text-black"
                    : "bg-white/10 text-white"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Voice Button - トグル式（1回押して開始、もう1回押して停止＆送信） */}
            <button
              onClick={toggleListening}
              disabled={isTTSGenerating || isLoading}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? "bg-red-500 ring-4 ring-red-500/50 scale-110"
                  : isTTSGenerating || isLoading
                  ? "bg-white/5 cursor-not-allowed"
                  : "bg-cyan-500 hover:bg-cyan-400"
              }`}
              title={isListening ? "🛑 クリックで停止＆送信" : "🎤 クリックで音声入力開始"}
            >
              {isListening ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-black" />
              )}
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "話してください..." : "メッセージを入力..."}
                disabled={isListening}
                className={`w-full bg-white/10 border rounded-full px-5 py-3 text-white placeholder-gray-500 focus:outline-none transition-all ${
                  isListening
                    ? "border-red-500/50 bg-red-500/10"
                    : "border-white/10 focus:border-cyan-500"
                }`}
              />
            </div>

            {/* Send Button */}
            <button
              data-send-btn
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || isListening}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isLoading
                  ? "bg-cyan-500/50"
                  : !input.trim() || isListening
                  ? "bg-white/10 opacity-50"
                  : "bg-cyan-500 hover:bg-cyan-400"
              }`}
              title="送信"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-black animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-black" />
              )}
            </button>

            {/* Speaker Button - TTS状態表示 + リプレイ機能 */}
            <button
              onClick={isSpeaking ? stopSpeaking : lastAssistantMessage ? () => speak(lastAssistantMessage) : undefined}
              disabled={isTTSGenerating && !isSpeaking}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isTTSGenerating
                  ? "bg-yellow-500 animate-pulse"
                  : isSpeaking
                  ? "bg-cyan-500 animate-pulse"
                  : lastAssistantMessage
                  ? "bg-white/10 hover:bg-white/20"
                  : "bg-white/5 cursor-not-allowed"
              }`}
              title={
                isTTSGenerating
                  ? "音声生成中..."
                  : isSpeaking
                  ? "停止"
                  : lastAssistantMessage
                  ? "再生"
                  : "音声なし"
              }
            >
              {isTTSGenerating ? (
                <Loader2 className="w-5 h-5 text-black animate-spin" />
              ) : isSpeaking ? (
                <Volume2 className="w-5 h-5 text-black" />
              ) : (
                <Volume2 className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>

          <p className="text-center text-gray-500 text-xs mt-3">
            {isListening
              ? "🔴 録音中... もう一度押すと停止＆送信"
              : "🎤 マイクを押して話す → もう一度押して送信"}
          </p>
        </div>
      </div>
    </div>
  );
}
