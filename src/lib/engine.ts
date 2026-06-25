// AI 엔진 프로바이더 추상화
// - "ollama": 내 컴퓨터의 무료 로컬 모델(Gemma). 앱을 로컬/데스크톱으로 켰을 때만 작동.
// - "claude": 외부 API(선택). 설정에서 키를 붙여넣거나, 서버 환경변수 ANTHROPIC_API_KEY 사용.
import Anthropic from "@anthropic-ai/sdk";

export type Provider = "claude" | "ollama";

/** 영상 장면 이미지 생성 프로바이더 (현재 OpenAI gpt-image-1) */
export type ImageProvider = "openai";

export interface EngineConfig {
  provider: Provider;
  claudeApiKey?: string; // 외부 API 키(선택, 기기에만 저장)
  ollamaBaseUrl?: string; // 기본 http://localhost:11434
  ollamaModel?: string; // 기본 gemma3:4b-it-qat (스탠리님 기존 패턴)
  // 영상용 AI 이미지 생성(선택, 유료)
  imageProvider?: ImageProvider;
  imageApiKey?: string; // 이미지 생성 API 키(기기에만 저장)
}

export const DEFAULT_OLLAMA_URL = "http://localhost:11434";
export const DEFAULT_OLLAMA_MODEL = "gemma3:4b-it-qat";

/** 어디서 와도 안전하게 기본값을 채운 설정으로 정규화 */
export function normalizeEngine(cfg?: Partial<EngineConfig> | null): EngineConfig {
  const provider: Provider = cfg?.provider === "ollama" ? "ollama" : "claude";
  return {
    provider,
    claudeApiKey: cfg?.claudeApiKey?.trim() || undefined,
    ollamaBaseUrl: (cfg?.ollamaBaseUrl?.trim() || DEFAULT_OLLAMA_URL).replace(/\/+$/, ""),
    ollamaModel: cfg?.ollamaModel?.trim() || DEFAULT_OLLAMA_MODEL,
    imageProvider: "openai",
    imageApiKey: cfg?.imageApiKey?.trim() || undefined,
  };
}

/** 장면 이미지 한 장 생성. 반환값은 PNG base64 문자열. */
export async function generateImage(
  cfg: EngineConfig,
  prompt: string,
  size: "1536x1024" | "1024x1536" | "1024x1024" = "1536x1024"
): Promise<string> {
  const apiKey = cfg.imageApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "이미지 생성 키가 없어요. 설정에서 이미지 API 키를 넣어 주세요. (영상에 들어갈 그림을 만들 때 필요해요)"
    );
  }
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size,
        n: 1,
      }),
    });
  } catch {
    throw new Error("이미지 생성 서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.");
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`이미지 생성 오류 (${res.status}). ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("이미지를 받지 못했어요. 다시 시도해 주세요.");
  return b64;
}

interface ChatOpts {
  user: string;
  system?: string;
  maxTokens?: number;
  claudeModel?: string; // claude일 때 사용할 모델
  json?: boolean; // 응답을 JSON으로 강제(로컬 모델 신뢰도↑)
}

/** 선택된 엔진으로 텍스트 생성. 반환값은 모델의 본문 텍스트. */
export async function runChat(cfg: EngineConfig, opts: ChatOpts): Promise<string> {
  return cfg.provider === "ollama" ? runOllama(cfg, opts) : runClaude(cfg, opts);
}

async function runOllama(cfg: EngineConfig, opts: ChatOpts): Promise<string> {
  const base = cfg.ollamaBaseUrl || DEFAULT_OLLAMA_URL;
  const model = cfg.ollamaModel || DEFAULT_OLLAMA_MODEL;
  const messages: { role: string; content: string }[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: opts.user });

  let res: Response;
  try {
    res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        keep_alive: "30m",
        ...(opts.json ? { format: "json" } : {}),
        options: { temperature: 0.7, num_ctx: 8192, num_predict: opts.maxTokens ?? 1536 },
      }),
    });
  } catch {
    throw new Error(
      "무료 로컬 AI에 연결하지 못했어요. 내 컴퓨터에서 앱을 켰는지, Ollama가 실행 중인지 확인해 주세요."
    );
  }
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `로컬 모델 '${model}'이 아직 설치되지 않았어요. 설정에서 모델을 내려받아 주세요.`
      );
    }
    throw new Error(`로컬 AI 오류가 났어요 (${res.status}).`);
  }
  const data = await res.json();
  const text = (data?.message?.content ?? "").trim();
  if (!text) throw new Error("로컬 AI가 빈 응답을 보냈어요. 다시 시도해 주세요.");
  return text;
}

async function runClaude(cfg: EngineConfig, opts: ChatOpts): Promise<string> {
  const apiKey = cfg.claudeApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Claude API 키가 없어요. 설정에서 키를 넣거나, 무료 로컬 AI(Gemma)로 바꿔 주세요."
    );
  }
  const client = new Anthropic({ apiKey });
  const model = opts.claudeModel ?? process.env.ANTHROPIC_SCRIPT_MODEL ?? "claude-sonnet-4-6";
  const msg = await client.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 1500,
    ...(opts.system ? { system: opts.system } : {}),
    messages: [{ role: "user", content: opts.user }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
