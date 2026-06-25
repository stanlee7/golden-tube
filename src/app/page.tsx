import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { HOOK_FORMULAS } from "@/lib/types";

export default function Home() {
  return (
    <main className="flex-1 text-[18px]">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-24 pb-20 text-center">
        <p className="inline-block rounded-full border-2 border-amber-300 px-4 py-1.5 text-base font-semibold text-amber-700 dark:border-amber-500/40 dark:text-amber-300">
          유튜브가 처음인 분도, 오늘 한 편
        </p>
        <h1 className="mt-7 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          말씀만 하세요.
          <br />
          <span className="text-amber-500">영상 한 편</span>이 완성됩니다.
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-xl text-neutral-600 dark:text-neutral-300">
          어려운 프로그램 필요 없어요. 만들고 싶은 이야기를 적기만 하면,
          <b> 내 말투 그대로 제목·대본·썸네일 글자·설명까지</b> 한 번에 만들어 드려요.
          올리는 방법까지 친절히 알려드립니다.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/onboarding"
            className="w-full rounded-xl bg-amber-500 px-8 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-amber-600 sm:w-auto"
          >
            무료로 시작하기
          </Link>
          <Link
            href="/studio"
            className="w-full rounded-xl border-2 border-black/10 px-8 py-4 text-lg font-bold transition hover:bg-black/5 dark:border-white/15 sm:w-auto"
          >
            먼저 둘러보기
          </Link>
        </div>
        <p className="mt-5 text-base text-neutral-400">
          카드 등록 없이 무료 3편 · 1분이면 내 채널 준비 완료
        </p>
        <p className="mt-4 text-base">
          <Link
            href="/settings"
            className="inline-block rounded-full border-2 border-amber-300 px-5 py-2 font-bold text-amber-700 transition hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-300"
          >
            💡 무료 로컬 AI(Gemma)로 쓰기 · 키 없이 → AI 설정
          </Link>
        </p>
      </section>

      {/* How it works */}
      <section className="border-y-2 border-amber-100 bg-amber-50/60 py-20 dark:border-white/10 dark:bg-neutral-950">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-3xl font-bold">3번만 누르면 끝나요</h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {[
              {
                n: "1",
                t: "이야기 적기",
                d: "오늘 만들 이야기를 머릿속 그대로 한 줄 적어요. 어렵게 쓸 필요 전혀 없어요.",
              },
              {
                n: "2",
                t: "시작·길이 고르기",
                d: "어떻게 시작할지, 짧게 할지 길게 할지 버튼으로 고르기만 하면 돼요.",
              },
              {
                n: "3",
                t: "영상 받기",
                d: "제목·대본·썸네일 글자·설명·태그까지 완성. 복사해서 그대로 쓰시면 됩니다.",
              },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-2xl font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-4 text-xl font-bold">{s.t}</h3>
                <p className="mt-2 leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hook formulas */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold">시청자를 붙잡는 시작법 4가지</h2>
        <p className="mt-3 text-center text-neutral-500">
          처음 몇 초가 가장 중요해요. 끝까지 보게 만드는 시작을 자동으로 넣어 드려요.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(HOOK_FORMULAS).map((h) => (
            <div
              key={h.label}
              className="rounded-2xl border-2 border-black/10 p-5 dark:border-white/15"
            >
              <h3 className="text-lg font-bold">{h.label}</h3>
              <p className="mt-1 text-base text-neutral-500">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t-2 border-amber-100 bg-amber-50/60 py-20 dark:border-white/10 dark:bg-neutral-950">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">요금제</h2>
          <p className="mt-3 text-center text-neutral-500">
            영상 편수만큼 · 매달 결제 · 언제든 그만둘 수 있어요
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className={`rounded-3xl border-2 p-6 ${
                  p.highlight
                    ? "border-amber-500 bg-amber-500 text-white"
                    : "border-black/10 dark:border-white/15"
                }`}
              >
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className={`mt-1 text-base ${p.highlight ? "opacity-80" : "text-neutral-500"}`}>
                  {p.tagline}
                </p>
                <div className="mt-4 text-3xl font-bold">
                  {p.priceKRW === 0 ? "₩0" : `₩${p.priceKRW.toLocaleString()}`}
                  <span className="text-base font-normal opacity-60">/월</span>
                </div>
                <ul className="mt-5 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="opacity-50">·</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-4xl px-6 py-12 text-center text-base text-neutral-400">
        <Link href="/settings" className="text-amber-600 underline">
          AI 설정 (무료 로컬 AI · Claude 키)
        </Link>
        <div className="mt-3">황금튜브 · 말씀만 하면 영상 한 편이 완성되는 시니어 유튜브 제작소</div>
      </footer>
    </main>
  );
}
