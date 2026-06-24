"use client";

import { BrandProfile } from "./types";
import type { EngineConfig } from "./engine";
import { DEFAULT_PLAN_ID, planById } from "./plans";

// MVP: 백엔드 DB 대신 localStorage. 추후 Supabase 로 이전.
const PROFILE_KEY = "goldentube.profile";
const PLAN_KEY = "goldentube.plan";
const USAGE_KEY = "goldentube.usage"; // { month: "2026-06", count: n }
const ENGINE_KEY = "goldentube.engine"; // 선택한 AI 엔진(로컬 Gemma / Claude)

/** 데스크톱 앱(내 컴퓨터)에서는 무료 로컬 AI를 기본으로, 웹에서는 Claude(외부키)를 기본으로. */
function defaultEngine(): EngineConfig {
  const desktop =
    typeof window !== "undefined" &&
    (window as { goldentube?: { isElectron?: boolean } }).goldentube?.isElectron;
  return { provider: desktop ? "ollama" : "claude" };
}

/** 현재 AI 엔진 설정(없으면 기본값). 키는 이 기기에만 저장됨. */
export function loadEngine(): EngineConfig {
  const def = defaultEngine();
  if (typeof window === "undefined") return def;
  const raw = localStorage.getItem(ENGINE_KEY);
  if (!raw) return def;
  try {
    return { ...def, ...(JSON.parse(raw) as EngineConfig) };
  } catch {
    return def;
  }
}

export function saveEngine(cfg: EngineConfig) {
  localStorage.setItem(ENGINE_KEY, JSON.stringify(cfg));
}

export function loadProfile(): BrandProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? (JSON.parse(raw) as BrandProfile) : null;
}

export function saveProfile(p: BrandProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function getPlanId(): string {
  if (typeof window === "undefined") return DEFAULT_PLAN_ID;
  return localStorage.getItem(PLAN_KEY) ?? DEFAULT_PLAN_ID;
}

export function setPlanId(id: string) {
  localStorage.setItem(PLAN_KEY, id);
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface Usage {
  month: string;
  count: number;
}

function readUsage(): Usage {
  if (typeof window === "undefined") return { month: currentMonth(), count: 0 };
  const raw = localStorage.getItem(USAGE_KEY);
  const u: Usage = raw ? JSON.parse(raw) : { month: currentMonth(), count: 0 };
  if (u.month !== currentMonth()) return { month: currentMonth(), count: 0 }; // 월 리셋
  return u;
}

export function getUsage() {
  const u = readUsage();
  const limit = planById(getPlanId()).monthlyScripts;
  return { used: u.count, limit, remaining: Math.max(0, limit - u.count) };
}

/** 생성 1건 차감. 한도 초과 시 false */
export function consumeUsage(): boolean {
  const u = readUsage();
  const limit = planById(getPlanId()).monthlyScripts;
  if (u.count >= limit) return false;
  const next: Usage = { month: u.month, count: u.count + 1 };
  localStorage.setItem(USAGE_KEY, JSON.stringify(next));
  return true;
}
