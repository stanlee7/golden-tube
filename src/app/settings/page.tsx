"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EngineConfig, Provider, ImageProvider } from "@/lib/engine";
import { loadEngine, saveEngine } from "@/lib/store";

// engine.ts 는 Claude SDK 를 포함하므로 클라이언트 번들을 위해 기본값만 이 파일에 둔다.
const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "gemma3:4b-it-qat";

// 데스크톱(Electron)에서 preload 가 주입하는 브릿지
interface DesktopBridge {
  isElectron: boolean;
  platform: string;
  ollamaStatus: () => Promise<{ running: boolean; hasModel: boolean; model: string }>;
  ollamaSetup: () => Promise<boolean>;
  ollamaPull: () => Promise<boolean>;
  onOllamaLog: (cb: (msg: string) => void) => () => void;
  onOllamaProgress: (cb: (p: { percent?: number; status?: string }) => void) => () => void;
}
declare global {
  interface Window {
    goldentube?: DesktopBridge;
  }
}

export default function SettingsPage() {
  const [provider, setProvider] = useState<Provider>("ollama");
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState(DEFAULT_OLLAMA_URL);
  const [ollamaModel, setOllamaModel] = useState(DEFAULT_OLLAMA_MODEL);
  const [imageProvider, setImageProvider] = useState<ImageProvider>("pollinations");
  const [imageApiKey, setImageApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    const e = loadEngine();
    setProvider(e.provider);
    setClaudeApiKey(e.claudeApiKey ?? "");
    setOllamaBaseUrl(e.ollamaBaseUrl ?? DEFAULT_OLLAMA_URL);
    setOllamaModel(e.ollamaModel ?? DEFAULT_OLLAMA_MODEL);
    setImageProvider(e.imageProvider === "openai" ? "openai" : "pollinations");
    setImageApiKey(e.imageApiKey ?? "");
  }, []);

  function current(): EngineConfig {
    return { provider, claudeApiKey, ollamaBaseUrl, ollamaModel, imageProvider, imageApiKey };
  }

  function save() {
    saveEngine(current());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/engine-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engine: current() }),
      });
      const data = await res.json();
      setResult({ ok: !!data.ok, message: data.message ?? "확인 완료" });
    } catch {
      setResult({ ok: false, message: "확인 중 문제가 생겼어요. 잠시 후 다시 해 주세요." });
    } finally {
      setTesting(false);
    }
  }

  const inputCls =
    "w-full rounded-2xl border-2 border-black/10 bg-transparent px-5 py-4 text-lg outline-none transition focus:border-amber-400 dark:border-white/15";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 text-[18px]">
      <Link href="/" className="text-base text-neutral-400 hover:underline">
        ← 황금튜브
      </Link>
      <h1 className="mt-4 text-3xl font-bold">AI 설정</h1>
      <p className="mt-3 text-neutral-500">
        영상을 만들 때 쓸 AI를 고르세요. <b>무료 로컬 AI</b>는 내 컴퓨터에서 공짜로 돌아가고,
        <b> Claude</b>는 외부 회사의 더 똑똑한 AI(유료, 내 키 필요)예요.
      </p>

      {/* 엔진 선택 */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <EngineCard
          on={provider === "ollama"}
          onClick={() => setProvider("ollama")}
          title="무료 로컬 AI (Gemma)"
          desc="내 컴퓨터에서 공짜로. 인터넷 없이도 작동. (데스크톱 앱·로컬 실행용)"
          badge="추천 · 무료"
        />
        <EngineCard
          on={provider === "claude"}
          onClick={() => setProvider("claude")}
          title="Claude (외부 API)"
          desc="더 똑똑한 결과. 내 API 키를 붙여넣어 사용. (선택)"
          badge="유료 · 선택"
        />
      </div>

      {/* 로컬(Ollama) 설정 */}
      {provider === "ollama" && (
        <div className="mt-7 space-y-5 rounded-2xl border-2 border-black/10 p-5 dark:border-white/15">
          <p className="text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
            처음이라면 컴퓨터에 <b>Ollama</b>를 설치하고 아래 명령으로 모델을 한 번만 내려받으면 돼요.
            (모델은 수 GB라 인터넷이 필요해요. 한 번 받으면 다음부턴 공짜로 계속 써요.)
          </p>
          <DesktopOllamaSetup model={ollamaModel} />
          <CopyRow text={`ollama pull ${ollamaModel}`} />
          <Field label="로컬 AI 주소">
            <input
              className={inputCls}
              value={ollamaBaseUrl}
              onChange={(e) => setOllamaBaseUrl(e.target.value)}
              placeholder={DEFAULT_OLLAMA_URL}
            />
          </Field>
          <Field label="모델 이름">
            <input
              className={inputCls}
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              placeholder={DEFAULT_OLLAMA_MODEL}
            />
          </Field>
        </div>
      )}

      {/* Claude 설정 */}
      {provider === "claude" && (
        <div className="mt-7 space-y-5 rounded-2xl border-2 border-black/10 p-5 dark:border-white/15">
          <Field label="Claude API 키">
            <input
              className={inputCls}
              type="password"
              value={claudeApiKey}
              onChange={(e) => setClaudeApiKey(e.target.value)}
              placeholder="sk-ant-..."
              autoComplete="off"
            />
          </Field>
          <p className="text-base leading-relaxed text-neutral-500">
            키는 <b>이 기기에만</b> 저장돼요(서버로 보내지 않아요). 키 발급은{" "}
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noreferrer"
              className="text-amber-600 underline"
            >
              console.anthropic.com
            </a>{" "}
            에서. 비워 두면 서버에 설정된 키가 있으면 그걸 써요.
          </p>
        </div>
      )}

      {/* 영상·썸네일용 그림 AI */}
      <h2 className="mt-10 text-2xl font-bold">그림 AI (영상 장면 · 썸네일)</h2>
      <p className="mt-2 text-base text-neutral-500">
        영상(.mp4) 장면과 썸네일 그림을 AI로 그려요. <b>기본은 무료</b>라 아무것도 안 해도 바로 돼요.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <EngineCard
          on={imageProvider === "pollinations"}
          onClick={() => setImageProvider("pollinations")}
          title="무료 그림 AI"
          desc="키 없이 공짜로 그림을 그려요. 그림 한 장에 10~30초 정도 걸려요."
          badge="추천 · 무료"
        />
        <EngineCard
          on={imageProvider === "openai"}
          onClick={() => setImageProvider("openai")}
          title="OpenAI 그림 (선택)"
          desc="더 정교한 그림. 내 OpenAI 키를 붙여넣어 사용해요."
          badge="유료 · 선택"
        />
      </div>
      {imageProvider === "openai" && (
        <div className="mt-4 rounded-2xl border-2 border-black/10 p-5 dark:border-white/15">
          <Field label="이미지 생성 API 키 (OpenAI)">
            <input
              className={inputCls}
              type="password"
              value={imageApiKey}
              onChange={(e) => setImageApiKey(e.target.value)}
              placeholder="sk-..."
              autoComplete="off"
            />
          </Field>
          <p className="mt-2 text-base leading-relaxed text-neutral-500">
            키는 <b>이 기기에만</b> 저장돼요. 키 발급은{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="text-amber-600 underline"
            >
              platform.openai.com
            </a>{" "}
            에서. (장면 1장당 약 70~110원)
          </p>
        </div>
      )}

      {/* 연결 확인 결과 */}
      {result && (
        <p
          className={`mt-6 rounded-xl px-5 py-4 text-base ${
            result.ok
              ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
              : "bg-red-50 text-red-600 dark:bg-red-950/40"
          }`}
        >
          {result.ok ? "✅ " : "⚠️ "}
          {result.message}
        </p>
      )}

      {/* 버튼 */}
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={test}
          disabled={testing}
          className="rounded-xl border-2 border-black/15 px-6 py-4 text-lg font-bold transition hover:bg-black/5 disabled:opacity-50 dark:border-white/20"
        >
          {testing ? "확인 중…" : "연결 확인"}
        </button>
        <button
          type="button"
          onClick={save}
          className="flex-1 rounded-xl bg-amber-500 px-6 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-amber-600"
        >
          {saved ? "저장됐어요!" : "저장하기"}
        </button>
      </div>

      <p className="mt-6 text-center text-base">
        <Link href="/studio" className="text-amber-600 underline">
          영상 만들러 가기 →
        </Link>
      </p>
    </main>
  );
}

function EngineCard({
  on,
  onClick,
  title,
  desc,
  badge,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  badge: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border-2 p-5 text-left transition ${
        on
          ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10"
          : "border-black/10 hover:border-black/25 dark:border-white/15"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xl font-bold">{title}</span>
        {on && <span className="text-amber-600">●</span>}
      </div>
      <div className="mt-1 inline-block rounded-full bg-black/5 px-2.5 py-0.5 text-sm text-neutral-500 dark:bg-white/10">
        {badge}
      </div>
      <p className="mt-2 text-base leading-relaxed text-neutral-600 dark:text-neutral-300">{desc}</p>
    </button>
  );
}

function CopyRow({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-black/5 px-4 py-3 dark:bg-white/10">
      <code className="overflow-x-auto whitespace-nowrap text-base">{text}</code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="shrink-0 rounded-lg border border-black/15 px-3 py-1.5 text-sm dark:border-white/20"
      >
        {copied ? "복사됨" : "복사"}
      </button>
    </div>
  );
}

// 데스크톱 앱에서만 보이는 '터미널 없이 준비' 카드
function DesktopOllamaSetup({ model }: { model: string }) {
  const [desktop, setDesktop] = useState<DesktopBridge | null>(null);
  const [busy, setBusy] = useState<"" | "setup" | "pull">("");
  const [log, setLog] = useState("");
  const [percent, setPercent] = useState<number | null>(null);
  const [status, setStatus] = useState<{ running: boolean; hasModel: boolean } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.goldentube?.isElectron) {
      setDesktop(window.goldentube);
      window.goldentube.ollamaStatus().then(setStatus).catch(() => {});
    }
  }, []);

  if (!desktop) return null; // 웹에서는 숨김(터미널 명령 안내로 대체)

  async function runSetup() {
    setBusy("setup");
    setLog("");
    const off = desktop!.onOllamaLog((m) => setLog(m));
    try {
      await desktop!.ollamaSetup();
      setStatus(await desktop!.ollamaStatus());
    } finally {
      off();
      setBusy("");
    }
  }

  async function runPull() {
    setBusy("pull");
    setPercent(0);
    const off = desktop!.onOllamaProgress((p) => {
      if (typeof p.percent === "number") setPercent(p.percent);
      if (p.status) setLog(p.status);
    });
    try {
      await desktop!.ollamaPull();
      setStatus(await desktop!.ollamaStatus());
    } finally {
      off();
      setBusy("");
      setPercent(null);
    }
  }

  const ready = status?.running && status?.hasModel;

  return (
    <div className="space-y-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 dark:border-amber-500/40 dark:bg-amber-500/10">
      <div className="text-lg font-bold">
        {ready ? "✅ 무료 로컬 AI 준비 완료" : "🛠️ 무료 로컬 AI 준비하기 (버튼만 누르면 돼요)"}
      </div>
      {!ready && (
        <p className="text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
          ① 먼저 <b>로컬 AI 준비</b>를 누르고, 끝나면 ② <b>모델 내려받기</b>를 눌러 주세요.
          모델은 한 번만 받으면 됩니다.
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={runSetup}
          disabled={busy !== ""}
          className="rounded-xl border-2 border-amber-400 px-5 py-3 text-base font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 dark:text-amber-300"
        >
          {busy === "setup" ? "준비 중…" : "① 로컬 AI 준비"}
        </button>
        <button
          type="button"
          onClick={runPull}
          disabled={busy !== ""}
          className="flex-1 rounded-xl bg-amber-500 px-5 py-3 text-base font-bold text-white transition hover:bg-amber-600 disabled:opacity-50"
        >
          {busy === "pull"
            ? `② 내려받는 중… ${percent ?? 0}%`
            : `② 모델 내려받기 (${model})`}
        </button>
      </div>
      {percent !== null && (
        <div className="h-3 overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
          <div
            className="h-full bg-amber-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
      {log && <p className="text-sm text-neutral-500">{log}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-lg font-bold">{label}</label>
      {children}
    </div>
  );
}
