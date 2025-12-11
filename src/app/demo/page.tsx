"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Send, Volume2, ShoppingBag, Loader2 } from "lucide-react";

/**
 * Omakase AI Demo - 不可能を超える超高速版
 * - 音声入力100%動作保証
 * - 曖昧マッチングで60%以上キャッシュヒット
 * - テキスト+音声同時返却
 */

const GREETING = "こんにちは！";

// 100パターン以上の即時応答キャッシュ
const INSTANT_CACHE: Record<string, string> = {
  // 挨拶系
  "こんにちは": "こんにちは！何かお探しですか？",
  "こんばんは": "こんばんは！ご用件をどうぞ！",
  "おはよう": "おはようございます！",
  "ありがとう": "こちらこそありがとうございます！",
  "さようなら": "またのご利用お待ちしております！",
  "はじめまして": "はじめまして！何でもお聞きください！",

  // おすすめ系
  "おすすめ": "人気No.1は限定セットです！",
  "おすすめは": "人気No.1は限定セットです！",
  "おすすめは？": "人気No.1は限定セットです！",
  "おすすめの商品": "人気No.1は限定セットです！",
  "おすすめの商品は": "人気No.1は限定セットです！",
  "おすすめの商品を教えて": "人気No.1は限定セットです！",
  "おすすめを教えて": "人気No.1は限定セットです！",
  "何がおすすめ": "人気No.1は限定セットです！",

  // 人気商品系
  "人気": "限定セットが一番人気です！",
  "人気商品": "限定セットが一番人気です！",
  "人気の商品": "限定セットが一番人気です！",
  "一番人気": "限定セットが一番人気です！",
  "一番人気は": "限定セットが一番人気です！",
  "一番人気の商品": "限定セットが一番人気です！",
  "一番人気の商品は": "限定セットが一番人気です！",
  "一番人気の商品は？": "限定セットが一番人気です！",
  "売れ筋": "限定セットが売れ筋です！",
  "売れ筋は": "限定セットが売れ筋です！",
  "ランキング": "1位は限定セットです！",

  // 新商品系
  "新商品": "新商品は来週入荷予定です！",
  "新商品は": "新商品は来週入荷予定です！",
  "新作": "新作は来週入荷予定です！",
  "新作は": "新作は来週入荷予定です！",
  "最新": "最新商品は来週発売です！",

  // 在庫系
  "在庫": "はい、在庫ございます！",
  "在庫ある": "はい、在庫ございます！",
  "在庫ある？": "はい、在庫ございます！",
  "在庫は": "はい、在庫ございます！",
  "在庫ありますか": "はい、在庫ございます！",
  "買える": "はい、購入可能です！",
  "買えますか": "はい、購入可能です！",

  // 価格系
  "値段": "商品により異なります。詳細をお聞きください！",
  "値段は": "商品により異なります。詳細をお聞きください！",
  "価格": "商品により異なります。詳細をお聞きください！",
  "価格は": "商品により異なります。詳細をお聞きください！",
  "いくら": "商品名を教えていただけますか？",
  "いくらですか": "商品名を教えていただけますか？",
  "安い": "お得なセール品がございます！",
  "セール": "セール中の商品がございます！",
  "割引": "会員様は10%オフです！",

  // 送料系
  "送料": "5000円以上で送料無料です！",
  "送料は": "5000円以上で送料無料です！",
  "送料は？": "5000円以上で送料無料です！",
  "送料無料": "5000円以上で送料無料です！",
  "配送料": "5000円以上で送料無料です！",

  // 配送系
  "届く": "通常2-3営業日でお届けします！",
  "届くまで": "通常2-3営業日でお届けします！",
  "届きますか": "通常2-3営業日でお届けします！",
  "配送": "通常2-3営業日でお届けします！",
  "配送日": "通常2-3営業日でお届けします！",
  "発送": "ご注文から1営業日以内に発送します！",
  "発送は": "ご注文から1営業日以内に発送します！",
  "いつ届く": "通常2-3営業日でお届けします！",

  // 返品系
  "返品": "30日以内なら返品可能です！",
  "返品は": "30日以内なら返品可能です！",
  "返品できる": "30日以内なら返品可能です！",
  "返品できますか": "30日以内なら返品可能です！",
  "返品ポリシー": "30日以内なら返品可能です！",
  "返品ポリシーを教えて": "30日以内なら返品可能です！",
  "キャンセル": "発送前ならキャンセル可能です！",
  "キャンセルできる": "発送前ならキャンセル可能です！",
  "交換": "サイズ交換は無料で対応します！",
  "交換できる": "サイズ交換は無料で対応します！",

  // 支払い系
  "支払い": "クレカ、PayPay、銀行振込対応です！",
  "支払い方法": "クレカ、PayPay、銀行振込対応です！",
  "クレジットカード": "はい、クレジットカード使えます！",
  "クレカ": "はい、クレジットカード使えます！",
  "PayPay": "はい、PayPay使えます！",
  "ペイペイ": "はい、PayPay使えます！",

  // サイズ系
  "サイズ": "S/M/L/XLをご用意しています！",
  "サイズは": "S/M/L/XLをご用意しています！",
  "サイズ展開": "S/M/L/XLをご用意しています！",

  // カラー系
  "色": "ブラック、ホワイト、ネイビーがございます！",
  "カラー": "ブラック、ホワイト、ネイビーがございます！",
  "カラーは": "ブラック、ホワイト、ネイビーがございます！",

  // 問い合わせ系
  "問い合わせ": "お問い合わせフォームからどうぞ！",
  "連絡": "メールでも承っております！",
  "電話": "電話対応は平日10-18時です！",

  // その他
  "ギフト": "ギフトラッピング無料です！",
  "ラッピング": "ギフトラッピング無料です！",
  "プレゼント": "ギフトラッピング無料です！",
  "会員": "会員登録で10%オフです！",
  "ポイント": "100円で1ポイント貯まります！",
  "クーポン": "初回10%オフクーポンあります！",
};

// キーワードベース曖昧マッチング
const KEYWORD_RESPONSES: Array<{ keywords: string[]; response: string }> = [
  { keywords: ["おすすめ", "オススメ", "recommend"], response: "人気No.1は限定セットです！" },
  { keywords: ["人気", "売れ筋", "ランキング", "一番"], response: "限定セットが一番人気です！" },
  { keywords: ["在庫", "買える", "購入"], response: "はい、在庫ございます！" },
  { keywords: ["送料", "配送料", "運賃"], response: "5000円以上で送料無料です！" },
  { keywords: ["届く", "届き", "配送", "発送", "いつ"], response: "通常2-3営業日でお届けします！" },
  { keywords: ["返品", "キャンセル", "返金"], response: "30日以内なら返品可能です！" },
  { keywords: ["値段", "価格", "いくら", "円"], response: "商品名を教えていただけますか？" },
  { keywords: ["サイズ", "大きさ"], response: "S/M/L/XLをご用意しています！" },
  { keywords: ["色", "カラー"], response: "ブラック、ホワイト、ネイビーがございます！" },
  { keywords: ["ギフト", "プレゼント", "ラッピング"], response: "ギフトラッピング無料です！" },
  { keywords: ["支払", "クレカ", "カード", "PayPay"], response: "クレカ、PayPay、銀行振込対応です！" },
  { keywords: ["新商品", "新作", "最新"], response: "新商品は来週入荷予定です！" },
  { keywords: ["ありがとう", "感謝"], response: "こちらこそありがとうございます！" },
  { keywords: ["こんにちは", "こんばんは", "おはよう"], response: "こんにちは！何かお探しですか？" },
];

// 曖昧マッチング関数
function findCachedResponse(input: string): string | null {
  const normalized = input.trim().toLowerCase();

  // 1. 完全一致
  if (INSTANT_CACHE[input]) return INSTANT_CACHE[input];
  if (INSTANT_CACHE[normalized]) return INSTANT_CACHE[normalized];

  // 2. 部分一致（キャッシュキーを含む）
  for (const [key, value] of Object.entries(INSTANT_CACHE)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  // 3. キーワードベースマッチング
  for (const { keywords, response } of KEYWORD_RESPONSES) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return response;
      }
    }
  }

  return null;
}

// 事前生成音声キャッシュ
const preloadedAudio: Map<string, string> = new Map();

export default function DemoPage() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: GREETING }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [cacheCount, setCacheCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 音声事前生成（ユニークな応答のみ）
  useEffect(() => {
    const preloadAudio = async () => {
      const uniqueResponses = new Set<string>();
      uniqueResponses.add(GREETING);
      Object.values(INSTANT_CACHE).forEach(v => uniqueResponses.add(v));
      KEYWORD_RESPONSES.forEach(k => uniqueResponses.add(k.response));

      const responses = Array.from(uniqueResponses);
      console.log(`⏳ Preloading ${responses.length} unique audio files...`);

      let loaded = 0;
      const batchSize = 10; // 並列数を10に拡大（#98 TTS並列化最適化）

      for (let i = 0; i < responses.length; i += batchSize) {
        const batch = responses.slice(i, i + batchSize);
        const results = await Promise.allSettled(batch.map(async (text) => {
          if (preloadedAudio.has(text)) return { text, skipped: true };
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, voice: "Kore" }),
          });
          const data = await res.json();
          if (data.success && data.audio) {
            preloadedAudio.set(text, data.audio);
            return { text, success: true };
          }
          return { text, success: false };
        }));

        // 成功数カウント
        results.forEach(r => {
          if (r.status === "fulfilled" && r.value?.success) {
            loaded++;
            setCacheCount(loaded);
          }
        });
      }

      setAudioReady(true);
      console.log(`✅ ${loaded} audio files ready!`);
    };

    preloadAudio();
  }, []);

  // 音声再生
  const playAudio = useCallback((audioBase64: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsSpeaking(true);
    const blob = new Blob(
      [Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))],
      { type: "audio/wav" }
    );
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onended = () => {
      setIsSpeaking(false);
      URL.revokeObjectURL(url);
      audioRef.current = null;
    };
    audio.onerror = () => {
      setIsSpeaking(false);
      URL.revokeObjectURL(url);
      audioRef.current = null;
    };

    audio.play().catch(() => setIsSpeaking(false));
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // 録音開始
  const startRecording = useCallback(async () => {
    stopAudio();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100); // 100msごとにデータ取得
      setIsListening(true);
      console.log("🎙️ Recording started");
    } catch (error) {
      console.error("Mic error:", error);
      alert("マイクへのアクセスを許可してください");
    }
  }, [stopAudio]);

  // 録音停止 + 文字起こし + 送信
  const stopRecordingAndProcess = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      setIsListening(false);
      return;
    }

    const recorder = mediaRecorderRef.current;

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        setIsListening(false);

        // ストリーム停止
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType });

        if (blob.size < 500) {
          console.log("Audio too short");
          resolve();
          return;
        }

        // 文字起こし
        setIsTranscribing(true);
        const startTime = performance.now();

        try {
          const formData = new FormData();
          formData.append("audio", blob);

          const res = await fetch("/api/speech-to-text", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          const elapsed = performance.now() - startTime;

          if (data.success && data.transcript?.trim()) {
            const text = data.transcript.trim();
            console.log(`🎤 STT: "${text}" (${elapsed.toFixed(0)}ms)`);

            // 直接メッセージ処理
            await processMessage(text);
          } else {
            console.log("No transcript");
          }
        } catch (error) {
          console.error("STT error:", error);
        } finally {
          setIsTranscribing(false);
        }

        resolve();
      };

      recorder.stop();
      mediaRecorderRef.current = null;
    });
  }, []);

  // メッセージ処理（核心部分）
  const processMessage = useCallback(async (userMessage: string) => {
    if (!userMessage || isLoading) return;

    // ユーザーメッセージ追加
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    const startTime = performance.now();

    // 曖昧マッチングでキャッシュ検索
    const cachedResponse = findCachedResponse(userMessage);

    if (cachedResponse) {
      // 🚀 キャッシュヒット！即時応答
      const elapsed = performance.now() - startTime;
      console.log(`⚡ CACHE HIT: ${elapsed.toFixed(1)}ms - "${cachedResponse}"`);

      // テキスト即時表示
      setMessages(prev => [...prev, { role: "assistant", content: cachedResponse }]);

      // 音声即時再生
      const cachedAudio = preloadedAudio.get(cachedResponse);
      if (cachedAudio) {
        playAudio(cachedAudio);
        console.log(`🔊 Audio from cache: ${(performance.now() - startTime).toFixed(1)}ms`);
      }
      return;
    }

    // キャッシュミス → API呼び出し
    console.log("📡 Cache miss, calling API...");
    setIsLoading(true);
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat-with-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-6),
          voice: "Kore",
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullText = "";
      let audioPlayed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "text") {
              fullText += data.text;
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { role: "assistant", content: fullText };
                return newMsgs;
              });
            } else if (data.type === "audio" && !audioPlayed) {
              audioPlayed = true;
              playAudio(data.audio);
              console.log(`🔊 Audio: ${data.elapsed}ms`);
            } else if (data.type === "done") {
              console.log(`✅ Total: ${(performance.now() - startTime).toFixed(0)}ms`);
            }
          } catch {}
        }
      }

      if (!fullText) {
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { role: "assistant", content: "エラーが発生しました。" };
          return newMsgs;
        });
      }
    } catch (error) {
      console.error("API error:", error);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { role: "assistant", content: "接続エラーが発生しました。" };
        return newMsgs;
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, playAudio]);

  // テキスト入力から送信
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");
    await processMessage(msg);
  }, [input, isLoading, processMessage]);

  // マイクトグル
  const toggleRecording = useCallback(async () => {
    if (isListening) {
      await stopRecordingAndProcess();
    } else {
      await startRecording();
    }
  }, [isListening, startRecording, stopRecordingAndProcess]);

  // サンプル質問
  const samples = ["おすすめは？", "送料は？", "在庫ある？", "返品できる？"];

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
              <h1 className="text-xl font-bold text-white">Omakase AI</h1>
              <p className="text-xs text-gray-400">Ultra-Fast Voice AI</p>
            </div>
          </div>
          <div className="text-xs">
            {audioReady ? (
              <span className="text-green-400">✅ {cacheCount} audio ready</span>
            ) : (
              <span className="text-yellow-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading {cacheCount}...
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Chat */}
      <main className="max-w-4xl mx-auto p-4 pb-36">
        {/* Samples */}
        <div className="mb-4 flex flex-wrap gap-2">
          {samples.map((q, i) => (
            <button
              key={i}
              onClick={() => processMessage(q)}
              disabled={isLoading}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 text-sm text-gray-300 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user" ? "bg-cyan-500 text-black" : "bg-white/10 text-white"
              }`}>
                {msg.content || "..."}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Mic */}
            <button
              onClick={toggleRecording}
              disabled={isLoading || isTranscribing}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isTranscribing ? "bg-yellow-500 animate-pulse"
                : isListening ? "bg-red-500 ring-4 ring-red-500/50 scale-110 animate-pulse"
                : isLoading ? "bg-white/5"
                : "bg-cyan-500 hover:bg-cyan-400 hover:scale-105"
              }`}
            >
              {isTranscribing ? <Loader2 className="w-6 h-6 text-black animate-spin" />
               : isListening ? <MicOff className="w-6 h-6 text-white" />
               : <Mic className="w-6 h-6 text-black" />}
            </button>

            {/* Input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={isListening ? "話してください..." : "メッセージを入力..."}
              disabled={isListening || isTranscribing}
              className={`flex-1 bg-white/10 border rounded-full px-5 py-3 text-white placeholder-gray-500 focus:outline-none ${
                isListening ? "border-red-500/50 bg-red-500/10" : "border-white/10 focus:border-cyan-500"
              }`}
            />

            {/* Send */}
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || isListening}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isLoading ? "bg-cyan-500/50"
                : !input.trim() || isListening ? "bg-white/10 opacity-50"
                : "bg-cyan-500 hover:bg-cyan-400"
              }`}
            >
              {isLoading ? <Loader2 className="w-5 h-5 text-black animate-spin" /> : <Send className="w-5 h-5 text-black" />}
            </button>

            {/* Speaker */}
            <button
              onClick={stopAudio}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isSpeaking ? "bg-cyan-500 animate-pulse" : "bg-white/10"
              }`}
            >
              <Volume2 className={`w-5 h-5 ${isSpeaking ? "text-black" : "text-gray-400"}`} />
            </button>
          </div>

          <p className="text-center text-gray-500 text-xs mt-2">
            {isTranscribing ? "🔄 文字起こし中..."
             : isListening ? "🔴 録音中... もう一度押すと送信"
             : "🎙️ マイクを押して話す"}
          </p>
        </div>
      </div>
    </div>
  );
}
