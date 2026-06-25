import { NextRequest, NextResponse } from "next/server";
import { MODELS } from "@/lib/anthropic";
import { runChat, normalizeEngine } from "@/lib/engine";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Scene {
  narration: string; // 이 장면에서 읽어줄 나레이션(자막으로도 사용)
  imagePrompt: string; // 이 장면 그림을 만들기 위한 영문 묘사
}

function parseScenes(raw: string): Scene[] {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  const obj = JSON.parse(s);
  const scenes: Scene[] = (obj.scenes ?? [])
    .map((x: { narration?: string; imagePrompt?: string }) => ({
      narration: String(x.narration ?? "").trim(),
      imagePrompt: String(x.imagePrompt ?? "").trim(),
    }))
    .filter((x: Scene) => x.narration && x.imagePrompt);
  return scenes;
}

export async function POST(req: NextRequest) {
  try {
    const { script, topic, engine } = await req.json();
    const cfg = normalizeEngine(engine);
    if (!script) {
      return NextResponse.json({ error: "대본이 필요해요." }, { status: 400 });
    }

    const prompt = `아래 영상 대본을 6~8개의 '장면'으로 나눠라. 각 장면은 영상의 한 컷이 된다.
대본을 자연스러운 의미 단위로 끊고, 각 장면마다 (1) 그대로 읽어줄 한국어 나레이션과
(2) 그 장면에 어울리는 그림을 만들기 위한 영어 이미지 묘사(image prompt)를 만들어라.
이미지 묘사는 한국적·시니어 친화적 장면을 따뜻한 색감으로, 사람 얼굴 클로즈업은 피하고 글자는 넣지 말 것.

[주제] ${topic ?? ""}
[대본]
${script}

아래 JSON 형식으로만 출력하라. 코드블록·설명 없이 순수 JSON:
{
  "scenes": [
    { "narration": "이 장면 나레이션(한국어, 1~2문장)", "imagePrompt": "English image description, warm tone, no text, no close-up faces" }
  ]
}`;

    const raw = await runChat(cfg, {
      user: prompt,
      maxTokens: 2500,
      claudeModel: MODELS.script,
      json: true,
    });
    const scenes = parseScenes(raw);
    if (!scenes.length) {
      return NextResponse.json({ error: "장면을 만들지 못했어요. 다시 시도해 주세요." }, { status: 500 });
    }
    return NextResponse.json({ scenes });
  } catch (e) {
    const message = e instanceof Error ? e.message : "장면 나누기 중 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
