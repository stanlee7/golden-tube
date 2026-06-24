"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandProfile } from "@/lib/types";
import { loadProfile, saveProfile, loadEngine } from "@/lib/store";

const TONE_SUGGESTIONS = [
  "다정한", "느긋한", "정겨운", "솔직한", "유쾌한",
  "차분한", "구수한", "따뜻한", "친근한", "씩씩한",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [expertise, setExpertise] = useState("");
  const [audience, setAudience] = useState("");
  const [tones, setTones] = useState<string[]>([]);
  const [forbidden, setForbidden] = useState("");
  const [samples, setSamples] = useState("");
  const [voiceSummary, setVoiceSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(
      !!(window as { goldentube?: { isElectron?: boolean } }).goldentube?.isElectron
    );
    const p = loadProfile();
    if (p) {
      setExpertise(p.expertise);
      setAudience(p.audience);
      setTones(p.toneKeywords);
      setForbidden(p.forbidden);
      setSamples(p.samples);
      setVoiceSummary(p.voiceSummary);
    }
  }, []);

  function toggleTone(t: string) {
    setTones((prev) =>
      prev.includes(t)
        ? prev.filter((x) => x !== t)
        : prev.length >= 3
        ? prev
        : [...prev, t]
    );
  }

  async function extractVoice() {
    setError("");
    if (!expertise.trim() || !audience.trim()) {
      setError("채널 주제와 보는 사람을 적어 주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/extract-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expertise, audience, toneKeywords: tones, samples, engine: loadEngine() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "정리 실패");
      setVoiceSummary(data.voiceSummary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "문제가 생겼어요. 잠시 후 다시 해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    const profile: BrandProfile = {
      expertise,
      audience,
      toneKeywords: tones,
      forbidden,
      samples,
      voiceSummary,
    };
    saveProfile(profile);
    router.push("/studio");
  }

  const inputCls =
    "w-full rounded-2xl border-2 border-black/10 bg-transparent px-5 py-4 text-xl outline-none transition focus:border-amber-400 dark:border-white/15";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 text-[18px]">
      <Link href="/" className="text-base text-neutral-400 hover:underline">
        ← 황금튜브
      </Link>
      <h1 className="mt-4 text-3xl font-bold">내 채널 만들기</h1>
      <p className="mt-3 text-neutral-500">
        한 번만 알려주시면, 앞으로 모든 영상이 <b>내 말투</b>로 만들어져요. 1분이면 됩니다.
      </p>

      {isDesktop && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 dark:border-amber-500/40 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-bold">🎁 무료 AI를 먼저 준비하세요</div>
            <p className="mt-1 text-base text-neutral-600 dark:text-neutral-300">
              내 컴퓨터에서 공짜로 돌아가는 AI예요. 버튼만 누르면 준비돼요. (처음 한 번만)
            </p>
          </div>
          <Link
            href="/settings"
            className="shrink-0 rounded-xl bg-amber-500 px-5 py-3 text-center text-base font-bold text-white transition hover:bg-amber-600"
          >
            무료 AI 준비하기 →
          </Link>
        </div>
      )}

      <div className="mt-10 space-y-8">
        <Field label="어떤 이야기를 하는 채널인가요?" required>
          <input
            className={inputCls}
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            placeholder="예: 옛날 추억 이야기 / 시골 텃밭 가꾸기"
          />
        </Field>

        <Field label="누가 보면 좋을까요?" required>
          <input
            className={inputCls}
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="예: 나처럼 60~70대, 옛 추억이 그리운 분들"
          />
        </Field>

        <Field label={`내 말투는 어떤가요? (최대 3개 · ${tones.length}/3)`}>
          <div className="flex flex-wrap gap-2.5">
            {TONE_SUGGESTIONS.map((t) => {
              const on = tones.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTone(t)}
                  className={`rounded-full border-2 px-4 py-2 text-lg transition ${
                    on
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-black/15 hover:bg-black/5 dark:border-white/20"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="쓰고 싶지 않은 표현이 있나요? (안 적어도 돼요)">
          <input
            className={inputCls}
            value={forbidden}
            onChange={(e) => setForbidden(e.target.value)}
            placeholder="예: 어려운 영어, 너무 가벼운 말투"
          />
        </Field>

        <Field label="평소에 말하듯 몇 줄 적어 보세요 (안 적어도 돼요)">
          <textarea
            className={`${inputCls} min-h-32 resize-y`}
            value={samples}
            onChange={(e) => setSamples(e.target.value)}
            placeholder="예전에 올린 영상에서 하신 말이나, 평소에 손주에게 이야기하듯 편하게 적어 주세요. 많을수록 내 말투를 잘 흉내 내요."
          />
        </Field>

        {error && (
          <p className="rounded-xl bg-red-50 px-5 py-4 text-base text-red-600 dark:bg-red-950/40">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={extractVoice}
          disabled={loading}
          className="w-full rounded-xl border-2 border-amber-400 py-4 text-lg font-bold text-amber-700 transition hover:bg-amber-50 disabled:opacity-50 dark:text-amber-300 dark:hover:bg-amber-500/10"
        >
          {loading ? "내 말투를 정리하는 중…" : "① 내 말투 정리하기"}
        </button>

        {voiceSummary && (
          <div className="rounded-2xl border-2 border-black/10 bg-neutral-50 p-5 dark:border-white/15 dark:bg-neutral-900">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold">이렇게 이해했어요</h3>
              <span className="text-base text-neutral-400">고치고 싶으면 바로 고쳐도 돼요</span>
            </div>
            <textarea
              className={`${inputCls} min-h-44 resize-y bg-white text-lg leading-relaxed dark:bg-neutral-950`}
              value={voiceSummary}
              onChange={(e) => setVoiceSummary(e.target.value)}
            />
            <button
              type="button"
              onClick={save}
              className="mt-4 w-full rounded-xl bg-amber-500 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-amber-600"
            >
              ② 저장하고 영상 만들러 가기 →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2.5 block text-lg font-bold">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
