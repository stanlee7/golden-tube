import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * 모델 선택
 * - 보이스 추출(1회성, 품질 중요): Opus
 * - 대본 생성(반복, 비용·속도 중요): Sonnet
 * env 로 덮어쓸 수 있음.
 */
export const MODELS = {
  voice: process.env.ANTHROPIC_VOICE_MODEL ?? "claude-opus-4-8",
  script: process.env.ANTHROPIC_SCRIPT_MODEL ?? "claude-sonnet-4-6",
} as const;

/** 응답에서 텍스트만 안전하게 추출 */
export function textFrom(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
