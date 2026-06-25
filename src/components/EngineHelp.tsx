"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const RELEASE_URL = "https://github.com/stanlee7/golden-tube/releases/latest";

/** 엔진(키/로컬) 관련 안내가 필요한 메시지인지 */
function isEngineMessage(msg: string) {
  return /키|로컬|연결|준비|Claude|API/.test(msg);
}

/**
 * AI 생성에 실패했을 때, 빨간 오류 대신 "무료로 쓰는 길"을 다정하게 안내한다.
 * - 데스크톱 앱: 무료 로컬 AI로 바꾸기(설정) — 바로 작동
 * - 웹: 무료 데스크톱 앱 내려받기(로컬 AI가 실제로 도는 곳) + Claude 키 넣기
 */
export default function EngineHelp({ message }: { message: string }) {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    setIsDesktop(
      !!(window as { goldentube?: { isElectron?: boolean } }).goldentube?.isElectron
    );
  }, []);

  // 엔진과 무관한 일반 오류(입력 누락 등)는 가벼운 회색 안내로
  if (!isEngineMessage(message)) {
    return (
      <p className="mt-5 rounded-xl bg-neutral-100 px-5 py-4 text-base text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
        {message}
      </p>
    );
  }

  const btn = "rounded-xl px-5 py-3.5 text-center text-base font-bold transition";

  return (
    <div className="mt-5 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 dark:border-amber-500/40 dark:bg-amber-500/10">
      <div className="text-lg font-bold">잠깐, AI를 먼저 정할게요 🙂</div>
      <p className="mt-1.5 text-base leading-relaxed text-neutral-700 dark:text-neutral-200">
        영상을 만들려면 AI가 필요해요. <b>무료로 쓰실 수 있어요</b> — 아래에서 골라 주세요.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {isDesktop ? (
          <Link href="/settings" className={`${btn} flex-1 bg-amber-500 text-white hover:bg-amber-600`}>
            무료 로컬 AI로 바꾸기 →
          </Link>
        ) : (
          <a
            href={RELEASE_URL}
            target="_blank"
            rel="noreferrer"
            className={`${btn} flex-1 bg-amber-500 text-white hover:bg-amber-600`}
          >
            🎁 무료 앱 받기 (내 컴퓨터에서 공짜)
          </a>
        )}
        <Link
          href="/settings"
          className={`${btn} border-2 border-amber-400 text-amber-700 hover:bg-amber-100 dark:text-amber-300`}
        >
          Claude 키 넣기
        </Link>
      </div>

      <p className="mt-3 text-sm text-neutral-500">
        💡 무료 로컬 AI(Gemma)는 내 컴퓨터에서 공짜로 돌아가요. 웹에서는 무료 앱을 받아야 켜져요.
      </p>
    </div>
  );
}
