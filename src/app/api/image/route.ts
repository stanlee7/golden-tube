import { NextRequest, NextResponse } from "next/server";
import { generateImage, normalizeEngine } from "@/lib/engine";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { prompt, size, engine } = await req.json();
    const cfg = normalizeEngine(engine);
    if (!prompt) {
      return NextResponse.json({ error: "그림 묘사가 필요해요." }, { status: 400 });
    }
    const b64 = await generateImage(cfg, prompt, size);
    return NextResponse.json({ image: b64 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "이미지 생성 중 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
