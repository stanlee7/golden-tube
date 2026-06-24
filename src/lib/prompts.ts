import { BrandProfile, HOOK_FORMULAS, HookType, Duration, DURATIONS } from "./types";

/** 평소 말투 샘플에서 '나만의 말투 특징'을 정리하는 프롬프트 */
export function voiceExtractionPrompt(p: {
  expertise: string;
  audience: string;
  toneKeywords: string[];
  samples: string;
}): string {
  return `너는 유튜브 채널의 화자 말투를 분석하는 전문가다.
아래는 어떤 시니어 유튜버(또는 유튜브를 막 시작하려는 어르신)의 채널 정보와 평소 말투 샘플이다.

[채널 주제] ${p.expertise}
[보는 사람] ${p.audience}
[원하는 말투] ${p.toneKeywords.join(", ")}

[평소 말투 샘플]
${p.samples || "(샘플 미제공 - 위 정보만으로 따뜻하고 진솔한 어르신 화자 말투를 추론)"}

이 사람이 직접 말하는 것처럼 대본을 쓸 수 있도록, 말투 특징을 다른 AI가 그대로 흉내 낼 수 있는 지침으로 정리하라.
다음 항목을 한국어로 각 1~2문장씩, 추상적 형용사 대신 '실제로 어떻게 말하는지' 관찰 가능한 특징으로 적어라.

- 문장 길이와 호흡 (짧게 끊는지, 길게 이야기하듯 하는지)
- 어미·말투 ('~합니다'체 / '~예요'체 / 구수한 입말 / 특유의 말버릇)
- 자주 쓰는 단어·표현
- 시청자를 부르는 방식 (여러분/친구처럼/손주에게 말하듯 등)
- 이야기를 풀어가는 방식 (경험담/옛날 이야기/숫자/질문 등)
- 절대 쓰지 않을 표현

마크다운 헤더 없이 '- ' 불릿 리스트로만 출력하라. 군더더기 설명 금지.`;
}

/** 영상 한 편 패키지(제목·대본·썸네일·설명·수익화팁)를 한 번에 생성하는 프롬프트 */
export function scriptGenerationPrompt(args: {
  profile: BrandProfile;
  topic: string;
  hook: HookType;
  duration: Duration;
}): string {
  const { profile, topic, hook, duration } = args;
  const hookF = HOOK_FORMULAS[hook];
  const dur = DURATIONS[duration];
  const isLong = duration === "long";

  return `너는 '${profile.expertise}' 주제로 유튜브를 하는 시니어 크리에이터의 전속 작가이자 채널 매니저다.
아래 [내 말투]를 100% 체화해서, 이 사람이 직접 말하는 것처럼 대본을 쓰고, 올리기 직전까지 필요한 것을 모두 준비하라.
누구나 쓸 법한 밋밋한 문장은 금지. 반드시 이 사람의 말투로, 시청자가 끝까지 보게.

[내 말투 - 반드시 따를 것]
${profile.voiceSummary}

[추가 조건]
- 보는 사람: ${profile.audience}
- 쓰지 말 것: ${profile.forbidden || "없음"}

[이번 영상]
- 주제: ${topic}
- 도입부 방식: ${hookF.label} — ${hookF.guide}
- 길이: ${dur.label} (${dur.desc}) / 분량 가이드: ${dur.words}

아래 JSON 형식으로만 출력하라. 코드블록·설명 없이 순수 JSON만. 모든 값은 한국어로.
${isLong ? "" : '이번 영상은 짧은 영상이므로 "chapters"는 빈 문자열("")로 둔다.\n'}{
  "title": "클릭하고 싶게 만드는 유튜브 제목 한 줄 (자극적 낚시 금지, 궁금하게)",
  "hook": "도입부 0~15초. 위 도입부 방식을 적용해 손을 멈추게 하는 첫마디",
  "body": "본문 대본. 내 말투 그대로, 길이 가이드에 맞게${isLong ? " 2~4개 꼭지로 나눠" : ""}",
  "cta": "마무리 한마디 (구독/좋아요/다음 영상 알림 중 가장 자연스러운 1개)",
  "fullScript": "hook+body+cta를 자연스럽게 이어 붙인, 그대로 읽으면 되는 전체 대본. 한 호흡 단위로 줄바꿈(\\n). 어려운 한자어·외래어는 쉬운 우리말로",
  "thumbnailText": "썸네일에 큼직하게 넣을 글자. 한 줄, 6~12자. 영상에서 가장 궁금한 한마디",
  "thumbnailPrompt": "이 영상에 어울리는 썸네일 사진을 만들기 위한 묘사. 한국 시니어 시청자에게 친근한 장면을 색감·구도·분위기까지 한 문단으로",
  "description": "유튜브 설명란에 그대로 붙여넣을 글. 2~3문장 요약 + 마지막 줄에 관련 해시태그 5개",
  "chapters": "${isLong ? "0:00 형식의 챕터 타임코드 목록(줄바꿈으로 구분). 본문 꼭지에 맞춰 추정 시간으로" : ""}",
  "tags": "검색에 잘 걸릴 유튜브 태그 8개를 쉼표로 구분",
  "monetizeTip": "이 어르신 크리에이터를 위한 친절한 코칭 3~4문장. (1)이 영상은 어떤 분들이 좋아할지 (2)올릴 때 한 가지 팁 (3)다음에 만들면 좋을 영상 주제 1개. 전문용어 없이 쉽게, 응원하는 말투로"
}`;
}
