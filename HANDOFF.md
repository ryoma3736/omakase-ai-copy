# Omakase AI Clone - 引き継ぎドキュメント

## プロジェクト概要
EC向け音声チャットAIウィジェット（Omakase.ai クローン）

## 現在の状態

### 完了した機能
- ✅ Gemini 2.5 Flash TTS統合 (`/api/tts/route.ts`)
- ✅ ストリーミングChat API (`/api/chat-stream/route.ts`)
- ✅ ストリーミングTTS API (`/api/tts-stream/route.ts`)
- ✅ 埋め込みウィジェット (`/public/widget/omakase-widget.js`)
- ✅ デモページ (`/src/app/demo/page.tsx`)

### 未解決の問題 🔴

**音声認識ボタンが勝手に切れる問題**

現在のコードは`continuous = true`でトグル式に実装したが、
ブラウザのSpeechRecognition APIは無音が続くと勝手に`onend`を発火する。

試した対策（全て失敗）:
1. `continuous = true` - 無音で切れる
2. 無音タイマーで再開 - 複雑化して不安定
3. `onerror`で再開 - 既にstart済みエラー

**根本解決案（未実装）**:
- MediaRecorder APIで音声録音 → Whisper/Gemini音声認識
- WebSocket常時接続
- `onend`発火時に自動で`recognition.start()`再呼び出し

## 重要ファイル

```
src/app/
├── demo/page.tsx          # メインデモページ（音声入力UI）
├── api/
│   ├── chat-stream/route.ts   # ストリーミングChat（Gemini）
│   ├── tts/route.ts           # TTS API（Gemini 2.5 Flash TTS）
│   └── tts-stream/route.ts    # ストリーミングTTS

public/widget/
├── omakase-widget.js      # 埋め込みウィジェット
└── test.html              # ウィジェットテストページ
```

## 環境変数
```
GOOGLE_GENERATIVE_AI_API_KEY=xxx  # Gemini API
```

## GitHub Issues
- #91 音声入力改善 + レスポンス高速化 v2（Master）
- #92 音声認識Continuous Mode
- #93 Chat API最適化
- #94 TTS事前生成

## 起動方法
```bash
cd /Users/satoryouma/genie_0.1/omakase-ai-copy
npm run dev
# http://localhost:3000/demo
```

## 技術スタック
- Next.js 15 (App Router)
- Gemini 2.0 Flash (Chat)
- Gemini 2.5 Flash Preview TTS (音声合成)
- Web Speech API (音声認識) ← **ここが問題**
- Tailwind CSS

## 次にやるべきこと

1. **音声認識の安定化**
   - `onend`発火時に`isListening`がtrueなら自動再開
   - または MediaRecorder + Whisper API に切り替え

2. **レスポンス速度改善**
   - 現在: Chat生成 → TTS生成 → 再生（直列）
   - 改善: 文単位で並列TTS生成、キュー再生

3. **本番デプロイ**
   - Vercel設定
   - 環境変数設定

## コード修正ポイント

`src/app/demo/page.tsx` の `toggleListening` 関数:

```typescript
// onendで勝手に切れる問題の対策案
recognition.onend = () => {
  // ユーザーが停止ボタンを押していない場合は再開
  if (isListening && recognitionRef.current) {
    try {
      recognition.start(); // 再開
      return;
    } catch (e) {}
  }
  // 以下は本当に停止する場合
  if (finalTranscriptRef.current.trim()) {
    // 送信処理
  }
  setIsListening(false);
};
```

---
最終更新: 2025-12-11
