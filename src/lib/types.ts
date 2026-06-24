// 황금튜브 — 시니어 유튜브 영상 제작 핵심 타입

/** 후킹 공식 종류 (도입부에서 시청자를 붙잡는 방식) */
export type HookType = "curiosity" | "empathy" | "twist" | "knowhow";

export const HOOK_FORMULAS: Record<
  HookType,
  { label: string; desc: string; guide: string }
> = {
  curiosity: {
    label: "궁금하게 만들기",
    desc: "끝까지 보게 되는 궁금증",
    guide:
      "시청자가 모르는 사실이나 결과를 살짝 흘려서 '저게 뭐지?' 하고 끝까지 보게 만든다. 결론은 본문에서 풀어준다.",
  },
  empathy: {
    label: "공감으로 시작",
    desc: "'내 얘기네' 싶은 상황",
    guide:
      "시청자가 평소에 겪는 고민이나 마음을 첫마디에서 정확히 짚는다. '혹시 이런 적 있으셨죠?' 식으로 다정하게 부른다.",
  },
  twist: {
    label: "통념 뒤집기",
    desc: "당연한 걸 뒤집어 놀라게",
    guide:
      "흔히 맞다고 믿는 이야기를 먼저 말하고 '사실은 정반대'라고 뒤집는다. 의외성으로 관심을 끈다.",
  },
  knowhow: {
    label: "유용한 정보",
    desc: "바로 써먹는 실전 정보",
    guide:
      "'3가지', '이것만 알면'처럼 분명한 도움이 되는 정보를 약속해서 저장하고 끝까지 보게 만든다.",
  },
};

/** 영상 길이 (유튜브 기준) */
export type Duration = "shorts" | "mid" | "long";

export const DURATIONS: Record<
  Duration,
  { label: string; desc: string; words: string }
> = {
  shorts: {
    label: "짧은 영상 (쇼츠)",
    desc: "1분 이내 · 휴대폰 세로 영상",
    words: "말 기준 약 150~250자. 군더더기 없이 빠르게.",
  },
  mid: {
    label: "보통 영상",
    desc: "3~5분 · 가볍게 보는 길이",
    words: "말 기준 약 600~900자. 도입-본문 2~3꼭지-마무리.",
  },
  long: {
    label: "긴 영상",
    desc: "8~10분 · 이야기·정보 깊게",
    words: "말 기준 약 1,500~2,200자. 챕터로 나눠 차근차근.",
  },
};

/**
 * 채널 프로필 - 1회 설정 후 모든 영상 대본에 주입.
 * (시니어 친화: '브랜드'가 아니라 '내 채널' 개념으로 사용)
 */
export interface BrandProfile {
  expertise: string; // 채널 주제 (예: "옛날 이야기와 추억", "시골 텃밭 가꾸기")
  audience: string; // 보는 사람 (예: "나처럼 60~70대, 옛 추억이 그리운 분들")
  toneKeywords: string[]; // 말투 키워드 3개 (예: ["다정한", "느긋한", "정겨운"])
  forbidden: string; // 쓰고 싶지 않은 표현
  samples: string; // 평소 말투 샘플 (말투 학습용, 선택)
  voiceSummary: string; // AI가 정리한 내 말투 특징 (extract-voice 결과)
}

/**
 * 생성된 '영상 한 편 패키지'.
 * 빠나나 같은 도구가 소재만 준다면, 황금튜브는 올리기 직전까지 완성한다.
 */
export interface GeneratedScript {
  title: string; // 유튜브 영상 제목 (클릭하고 싶게)
  hook: string; // 도입부 (0~15초, 위 후킹 공식 적용)
  body: string; // 본문 대본
  cta: string; // 마무리 (구독·좋아요·다음 영상 유도 중 1개)
  fullScript: string; // 낭독/자막용 전체 대본. 호흡 단위로 줄바꿈
  thumbnailText: string; // 썸네일에 크게 넣을 글자 (한 줄, 6~12자)
  thumbnailPrompt: string; // 썸네일 이미지 생성용 묘사 프롬프트
  description: string; // 유튜브 '설명란'에 붙여넣을 글 (요약 + 안내)
  chapters: string; // 챕터 타임코드 (긴 영상용. 없으면 빈 문자열)
  tags: string; // 쉼표로 구분된 태그
  monetizeTip: string; // 업로드·수익화 코칭 (이 주제의 시청층, 올리는 팁, 다음 영상 추천)
}
