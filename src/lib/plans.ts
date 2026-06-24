// 월 구독 요금제 (영상 편수 종량) - 시니어 유튜브 크리에이터 타겟

export interface Plan {
  id: string;
  name: string;
  priceKRW: number;
  monthlyScripts: number; // 월 만들 수 있는 영상 편수
  tagline: string;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "체험",
    priceKRW: 0,
    monthlyScripts: 3,
    tagline: "내 말투로 진짜 영상이 나오는지 먼저 확인",
    features: ["내 채널 1개", "월 영상 3편", "제목·대본·썸네일 글자"],
  },
  {
    id: "starter",
    name: "기본",
    priceKRW: 14900,
    monthlyScripts: 15,
    tagline: "일주일에 두세 번 꾸준히 올리는 분",
    features: ["내 채널 1개", "월 영상 15편", "설명란·태그 자동", "업로드 코칭"],
  },
  {
    id: "pro",
    name: "열심히",
    priceKRW: 29900,
    monthlyScripts: 50,
    tagline: "거의 매일 올리며 채널을 키우는 분",
    features: ["내 채널 3개", "월 영상 50편", "긴 영상·챕터", "썸네일 이미지(예정)"],
    highlight: true,
  },
  {
    id: "team",
    name: "교실",
    priceKRW: 79000,
    monthlyScripts: 200,
    tagline: "복지관·평생교육원에서 여러 어르신과 함께",
    features: ["내 채널 10개", "월 영상 200편", "모든 기능", "강사용 교안(예정)"],
  },
];

export const DEFAULT_PLAN_ID = "free";
export const planById = (id: string) => PLANS.find((p) => p.id === id) ?? PLANS[0];
