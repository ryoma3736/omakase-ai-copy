/**
 * Speech-to-Text API using Gemini
 * MediaRecorder → Gemini Audio Transcription
 */

export const runtime = "edge";

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob;

    if (!audioFile) {
      return Response.json({ success: false, error: "No audio file" }, { status: 400 });
    }

    // Convert blob to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ success: false, error: "API key not configured" }, { status: 500 });
    }

    // Use Gemini 2.0 Flash for fast audio transcription
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: audioFile.type || "audio/webm",
                    data: base64Audio,
                  },
                },
                {
                  text: "この音声を日本語でテキストに書き起こしてください。音声の内容のみを返し、説明は不要です。",
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini STT error:", errorText);
      return Response.json({ success: false, error: "Transcription failed" }, { status: 500 });
    }

    const result = await response.json();
    const transcript = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    const elapsed = Date.now() - startTime;
    console.log(`🎤 Speech-to-text completed in ${elapsed}ms: "${transcript}"`);

    return Response.json({
      success: true,
      transcript,
      elapsed,
    });
  } catch (error) {
    console.error("STT error:", error);
    return Response.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
