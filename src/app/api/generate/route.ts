import { NextRequest, NextResponse } from "next/server";
import { MODELS } from "@/lib/anthropic";
import { runChat, normalizeEngine } from "@/lib/engine";
import { scriptGenerationPrompt } from "@/lib/prompts";
import { GeneratedScript } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** 모델이 코드블록을 덧붙여도 JSON만 뽑아내기 */
function parseScript(raw: string): GeneratedScript {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  return JSON.parse(s) as GeneratedScript;
}

export async function POST(req: NextRequest) {
  try {
    const { profile, topic, hook, duration, engine } = await req.json();
    const cfg = normalizeEngine(engine);

    if (!profile?.voiceSummary) {
      return NextResponse.json(
        { error: "먼저 내 채널과 말투를 설정해 주세요." },
        { status: 400 }
      );
    }
    if (!topic) {
      return NextResponse.json({ error: "영상 주제를 입력해 주세요." }, { status: 400 });
    }

    const raw = await runChat(cfg, {
      user: scriptGenerationPrompt({ profile, topic, hook, duration }),
      maxTokens: 3500,
      claudeModel: MODELS.script,
      json: true,
    });

    const script = parseScript(raw);
    return NextResponse.json({ script });
  } catch (e) {
    const message = e instanceof Error ? e.message : "영상 만들기 중 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
