import { NextRequest, NextResponse } from "next/server";
import { normalizeEngine } from "@/lib/engine";

export const runtime = "nodejs";
export const maxDuration = 30;

/** 선택한 엔진이 실제로 쓸 준비가 됐는지 확인한다. (설정 화면의 '연결 확인'용) */
export async function POST(req: NextRequest) {
  const { engine } = await req.json();
  const cfg = normalizeEngine(engine);

  if (cfg.provider === "ollama") {
    try {
      const res = await fetch(`${cfg.ollamaBaseUrl}/api/tags`, { method: "GET" });
      if (!res.ok) {
        return NextResponse.json({
          ok: false,
          message: `로컬 AI(Ollama)는 응답했지만 오류가 났어요 (${res.status}).`,
        });
      }
      const data = await res.json();
      const models: string[] = (data?.models ?? []).map((m: { name: string }) => m.name);
      const wanted = cfg.ollamaModel || "";
      const family = wanted.split(":")[0];
      const hasModel = models.some((n) => n === wanted || n.startsWith(family));
      return NextResponse.json({
        ok: true,
        provider: "ollama",
        model: wanted,
        models,
        hasModel,
        message: hasModel
          ? `무료 로컬 AI 준비 완료예요! (${wanted})`
          : `로컬 AI는 켜져 있어요. 다만 '${wanted}' 모델이 아직 없어요. 모델을 내려받아 주세요.`,
      });
    } catch {
      return NextResponse.json({
        ok: false,
        provider: "ollama",
        message:
          "무료 로컬 AI에 연결하지 못했어요. 내 컴퓨터에서 앱을 켜고 Ollama가 실행 중인지 확인해 주세요.",
      });
    }
  }

  // claude
  const key = cfg.claudeApiKey || process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({
    ok: !!key,
    provider: "claude",
    message: key
      ? "Claude API 키가 확인됐어요. 바로 사용할 수 있어요."
      : "Claude API 키가 없어요. 키를 넣거나 무료 로컬 AI로 바꿔 주세요.",
  });
}
