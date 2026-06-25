"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BrandProfile,
  GeneratedScript,
  HOOK_FORMULAS,
  HookType,
  Duration,
  DURATIONS,
} from "@/lib/types";
import { loadProfile, getUsage, consumeUsage, loadEngine } from "@/lib/store";
import EngineHelp from "@/components/EngineHelp";

export default function StudioPage() {
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [hook, setHook] = useState<HookType>("curiosity");
  const [duration, setDuration] = useState<Duration>("shorts");
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState({ used: 0, limit: 3, remaining: 3 });

  useEffect(() => {
    setProfile(loadProfile());
    setUsage(getUsage());
  }, []);

  async function generate() {
    setError("");
    if (!topic.trim()) {
      setError("어떤 영상을 만들지 적어 주세요.");
      setStep(1);
      return;
    }
    if (usage.remaining <= 0) {
      setError("이번 달 만들 수 있는 영상을 다 쓰셨어요. 요금제를 올리면 더 만들 수 있어요.");
      return;
    }
    setLoading(true);
    setScript(null);
    setStep(3);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, topic, hook, duration, engine: loadEngine() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "만들기 실패");
      setScript(data.script);
      consumeUsage();
      setUsage(getUsage());
    } catch (e) {
      setError(e instanceof Error ? e.message : "문제가 생겼어요. 잠시 후 다시 해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setScript(null);
    setTopic("");
    setStep(1);
    setError("");
  }

  if (profile === null) {
    return (
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-6 py-24 text-center text-[18px]">
        <h1 className="text-3xl font-bold">먼저 내 채널을 만들어 주세요</h1>
        <p className="mt-4 text-neutral-500">
          어떤 영상을 만들지 정하려면, 내 채널과 말투를 한 번만 알려주시면 됩니다. 1분이면 돼요.
        </p>
        <Link
          href="/onboarding"
          className="mt-8 rounded-xl bg-amber-500 px-8 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-amber-600"
        >
          내 채널 만들기 →
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 text-[18px]">
      {/* 상단 바 */}
      <div className="flex items-center justify-between">
        <Link href="/" className="text-base text-neutral-400 hover:underline">
          ← 황금튜브
        </Link>
        <div className="flex items-center gap-4 text-base">
          <span className="text-neutral-500">
            이번 달 <b className="text-foreground">{usage.used}</b> / {usage.limit}편
          </span>
          <Link href="/onboarding" className="text-neutral-400 hover:underline">
            내 채널 수정
          </Link>
          <Link href="/settings" className="text-neutral-400 hover:underline">
            설정
          </Link>
        </div>
      </div>

      {/* 진행 단계 */}
      <Stepper step={script || loading ? 3 : step} />

      {/* 1단계: 주제 */}
      {step === 1 && !script && !loading && (
        <section className="mt-2">
          <h1 className="text-3xl font-bold">어떤 영상을 만들까요?</h1>
          <p className="mt-2 text-neutral-500">
            머릿속에 있는 이야기를 편하게 적어 주세요. <b>{profile.expertise}</b> 채널 말투로 만들어 드려요.
          </p>
          <textarea
            className="mt-6 min-h-36 w-full resize-y rounded-2xl border-2 border-black/10 bg-transparent px-5 py-4 text-xl leading-relaxed outline-none transition focus:border-amber-400 dark:border-white/15"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 70년대 우리 동네 시장 풍경과 그때 먹던 음식 이야기"
            autoFocus
          />
          <BigButton
            onClick={() => {
              if (!topic.trim()) {
                setError("어떤 영상을 만들지 적어 주세요.");
                return;
              }
              setError("");
              setStep(2);
            }}
          >
            다음 →
          </BigButton>
          {error && <ErrorBox>{error}</ErrorBox>}
        </section>
      )}

      {/* 2단계: 시작 방식 + 길이 */}
      {step === 2 && !script && !loading && (
        <section className="mt-2">
          <h1 className="text-3xl font-bold">어떻게 시작할까요?</h1>
          <p className="mt-2 text-neutral-500">시청자가 끝까지 보게 만드는 시작 방법을 골라 주세요.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {(Object.keys(HOOK_FORMULAS) as HookType[]).map((k) => {
              const f = HOOK_FORMULAS[k];
              const on = hook === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setHook(k)}
                  className={`rounded-2xl border-2 p-5 text-left transition ${
                    on
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10"
                      : "border-black/10 hover:border-black/25 dark:border-white/15"
                  }`}
                >
                  <div className="text-xl font-bold">{f.label}</div>
                  <div className="mt-1 text-base text-neutral-500">{f.desc}</div>
                </button>
              );
            })}
          </div>

          <h2 className="mt-8 text-2xl font-bold">영상 길이는요?</h2>
          <div className="mt-4 grid gap-3">
            {(Object.keys(DURATIONS) as Duration[]).map((d) => {
              const on = duration === d;
              const info = DURATIONS[d];
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition ${
                    on
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10"
                      : "border-black/10 hover:border-black/25 dark:border-white/15"
                  }`}
                >
                  <span className="text-xl font-bold">{info.label}</span>
                  <span className="text-base text-neutral-500">{info.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border-2 border-black/10 px-6 py-4 text-lg font-bold transition hover:bg-black/5 dark:border-white/15"
            >
              ← 이전
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={usage.remaining <= 0}
              className="flex-1 rounded-xl bg-amber-500 px-6 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50"
            >
              영상 만들기 ✨
            </button>
          </div>
          {error && <ErrorBox>{error}</ErrorBox>}
        </section>
      )}

      {/* 3단계: 결과 */}
      {(loading || script) && (
        <section className="mt-2">
          {loading && (
            <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-black/10 text-neutral-500 dark:border-white/15">
              <span className="text-2xl">✍️</span>
              <span className="animate-pulse text-lg">내 말투로 영상 한 편을 만들고 있어요…</span>
              <span className="text-sm text-neutral-400">10~20초 정도 걸려요</span>
            </div>
          )}
          {error && !loading && <EngineHelp message={error} />}
          {script && !loading && <ResultPackage script={script} onReset={reset} />}
        </section>
      )}
    </main>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["주제 정하기", "시작·길이", "영상 완성"];
  return (
    <div className="my-6 flex items-center gap-2">
      {labels.map((l, i) => {
        const n = i + 1;
        const on = step >= n;
        return (
          <div key={l} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                on ? "bg-amber-500 text-white" : "bg-black/10 text-neutral-400 dark:bg-white/10"
              }`}
            >
              {n}
            </div>
            <span className={`text-base ${on ? "font-semibold" : "text-neutral-400"}`}>{l}</span>
            {n < 3 && <div className="h-0.5 flex-1 bg-black/10 dark:bg-white/10" />}
          </div>
        );
      })}
    </div>
  );
}

function BigButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 w-full rounded-xl bg-amber-500 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-amber-600"
    >
      {children}
    </button>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 rounded-xl bg-red-50 px-5 py-4 text-base text-red-600 dark:bg-red-950/40">
      {children}
    </p>
  );
}

function ResultPackage({
  script,
  onReset,
}: {
  script: GeneratedScript;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState("");

  function copy(label: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1800);
  }

  // 시니어가 순서대로 따라 하면 영상 한 편이 완성되도록 배치
  const cards: { key: string; label: string; emoji: string; text: string; mono?: boolean }[] = [
    { key: "title", label: "유튜브 제목", emoji: "📺", text: script.title },
    { key: "fullScript", label: "그대로 읽으면 되는 대본", emoji: "🎤", text: script.fullScript },
    { key: "thumbnailText", label: "썸네일에 넣을 큰 글자", emoji: "🖼️", text: script.thumbnailText },
    { key: "description", label: "영상 설명란", emoji: "📝", text: script.description },
    { key: "tags", label: "태그", emoji: "🏷️", text: script.tags },
  ];
  if (script.chapters?.trim())
    cards.splice(4, 0, {
      key: "chapters",
      label: "챕터(목차)",
      emoji: "📑",
      text: script.chapters,
      mono: true,
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">영상이 준비됐어요! 🎉</h1>
        <button
          type="button"
          onClick={() => copy("전체", buildAll(script))}
          className="rounded-xl bg-amber-500 px-5 py-3 text-base font-bold text-white transition hover:bg-amber-600"
        >
          {copied === "전체" ? "복사됐어요!" : "전체 복사"}
        </button>
      </div>

      {cards.map((c) => (
        <div key={c.key} className="rounded-2xl border-2 border-black/10 p-5 dark:border-white/15">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-lg font-bold">
              {c.emoji} {c.label}
            </span>
            <button
              type="button"
              onClick={() => copy(c.key, c.text)}
              className="rounded-lg border border-black/15 px-3 py-1.5 text-base text-neutral-600 transition hover:bg-black/5 dark:border-white/20 dark:text-neutral-300"
            >
              {copied === c.key ? "복사됨" : "복사"}
            </button>
          </div>
          <p
            className={`whitespace-pre-wrap leading-relaxed ${
              c.mono ? "font-mono text-base" : "text-lg"
            }`}
          >
            {c.text}
          </p>
        </div>
      ))}

      {/* 수익화 코칭 — 차별화 핵심 */}
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <div className="mb-2 text-lg font-bold">💡 올리기 전에, 한마디 조언</div>
        <p className="whitespace-pre-wrap text-lg leading-relaxed">{script.monetizeTip}</p>
      </div>

      {/* 썸네일 묘사(이미지 생성용 — 다음 버전에서 자동 생성 예정) */}
      <details className="rounded-2xl border-2 border-dashed border-black/15 p-5 dark:border-white/15">
        <summary className="cursor-pointer text-base font-semibold text-neutral-500">
          🎨 썸네일 사진 묘사 보기 (그림 만들 때 사용)
        </summary>
        <div className="mt-3 flex items-start justify-between gap-3">
          <p className="text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
            {script.thumbnailPrompt}
          </p>
          <button
            type="button"
            onClick={() => copy("thumb", script.thumbnailPrompt)}
            className="shrink-0 rounded-lg border border-black/15 px-3 py-1.5 text-sm dark:border-white/20"
          >
            {copied === "thumb" ? "복사됨" : "복사"}
          </button>
        </div>
      </details>

      <button
        type="button"
        onClick={onReset}
        className="mt-2 w-full rounded-xl border-2 border-black/10 py-4 text-lg font-bold transition hover:bg-black/5 dark:border-white/15"
      >
        + 새 영상 만들기
      </button>
    </div>
  );
}

function buildAll(s: GeneratedScript): string {
  const lines = [
    `[제목]\n${s.title}`,
    `[대본]\n${s.fullScript}`,
    `[썸네일 글자]\n${s.thumbnailText}`,
    `[설명란]\n${s.description}`,
    s.chapters?.trim() ? `[챕터]\n${s.chapters}` : "",
    `[태그]\n${s.tags}`,
    `[조언]\n${s.monetizeTip}`,
  ].filter(Boolean);
  return lines.join("\n\n");
}
