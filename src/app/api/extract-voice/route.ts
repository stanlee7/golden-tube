import { NextRequest, NextResponse } from "next/server";
import { MODELS } from "@/lib/anthropic";
import { runChat, normalizeEngine } from "@/lib/engine";
import { voiceExtractionPrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { expertise, audience, toneKeywords, samples, engine } = await req.json();
    const cfg = normalizeEngine(engine);

    if (!expertise || !audience) {
      return NextResponse.json(
        { error: "채널 주제와 보는 사람은 꼭 적어 주세요." },
        { status: 400 }
      );
    }

    const voiceSummary = await runChat(cfg, {
      user: voiceExtractionPrompt({
        expertise,
        audience,
        toneKeywords: toneKeywords ?? [],
        samples: samples ?? "",
      }),
      maxTokens: 1024,
      claudeModel: MODELS.voice,
    });

    return NextResponse.json({ voiceSummary });
  } catch (e) {
    const message = e instanceof Error ? e.message : "말투 정리 중 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
