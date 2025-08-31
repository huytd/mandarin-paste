import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODELS = [
  "mistralai/mistral-small-3.2-24b-instruct:free",
  "meta-llama/llama-3.3-8b-instruct:free",
];

function buildTranslationSystemPrompt(): string {
  return (
    "You are a professional translator. Translate the user's input to natural, fluent English. " +
    "Preserve meaning, tone, and essential formatting. " +
    "Return only the English translation without any commentary."
  );
}

type TranslateRequestBody = {
  text?: string;
};

export async function POST(request: Request) {
  try {
    let text: string | undefined;
    try {
      const body = (await request.json()) as TranslateRequestBody;
      text = typeof body?.text === "string" ? body.text : undefined;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Missing 'text' in request body" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const system = buildTranslationSystemPrompt();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODELS[Math.floor(Math.random() * MODELS.length)],
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: text },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Translation failed" }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }

    const data = await response.json();
    const translation: string = data?.choices?.[0]?.message?.content ?? "";

    return NextResponse.json(
      { translation },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
