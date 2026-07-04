# 황금튜브 (GoldenTube) — 시니어 유튜브 영상 제작소

유튜브가 처음인 어르신(60~70대)을 위한 AI 영상 제작 도구.
만들고 싶은 이야기를 한 줄 적으면, **내 말투 그대로 영상 한 편에 필요한 모든 것**을 한 번에 만들어줍니다.

> **빠나나(bbanana.ai) 등 생성형 AI 통합 래퍼와의 차별점**
> 그들은 "이미지·영상 소재"를 주는 **도구 백화점**입니다. 황금튜브는 유튜브 1개 목적에 특화해
> 제목·대본·썸네일 글자·설명·태그 + **"어떻게 올리고 어떤 분이 좋아할지" 수익화 코칭**까지,
> 올리기 직전 상태로 완성합니다. "만들고 나서 뭐?"라는 시니어의 가장 큰 난제를 정면으로 풉니다.

## 핵심 차별점

- **이야기 한 줄 → 영상 한 편 패키지**: 제목 · 대본(그대로 낭독) · 썸네일 큰 글자 · 설명란 · 태그 · 챕터
- **내 말투 학습**: 채널 주제·시청자·말투 + 평소 말투 샘플 → AI가 내 말투 지침으로 정리해 저장
- **수익화 코칭(차별화 핵심)**: 이 영상은 어떤 분이 좋아할지, 올릴 때 팁, 다음 영상 추천
- **시니어 접근성 UI**: 큰 글씨·큰 버튼·3단계 위저드·한국어 쉬운 말
- **검증된 시작법 4종**: 궁금하게 / 공감 / 통념 뒤집기 / 유용한 정보
- **월 구독(영상 편수 종량)**: 체험(3) / 기본(15) / 열심히(50) / 교실(200, 복지관·평생교육원용)

## AI 엔진 — 무료 로컬 + 외부 API(선택)

`src/lib/engine.ts` 의 프로바이더 추상화로 두 엔진을 모두 지원. 설정(`/settings`)에서 선택하며,
선택값은 localStorage(`goldentube.engine`)에 저장돼 모든 생성 요청에 함께 전달된다.

- **무료 로컬 (`ollama`)**: 내 컴퓨터의 Ollama + `gemma3:4b-it-qat` (DocBatch/DocForge와 동일 패턴).
  `${baseUrl}/api/chat` 호출. 앱을 로컬/데스크톱으로 켰을 때만 작동(원격 웹에선 사용자 localhost 접근 불가).
- **Claude (`claude`, 선택·유료)**: 설정에서 키를 붙여넣거나(기기에만 저장), 서버 환경변수 `ANTHROPIC_API_KEY` 사용.
  - 말투 정리: `claude-opus-4-8` / 영상 패키지: `claude-sonnet-4-6`
- **연결 확인**: `/api/engine-status` 가 Ollama 실행/모델 설치 여부, Claude 키 유무를 점검.

**그림 AI(영상 장면·썸네일)** 도 같은 파일의 `generateImage` 프로바이더 추상화:
- **무료(`pollinations`, 기본)**: pollinations.ai — 키 불필요, 3회 재시도. 웹/데스크톱 모두 작동.
- **OpenAI(`openai`, 선택·유료)**: `gpt-image-1`, 설정에서 키 입력(기기에만 저장) 또는 `OPENAI_API_KEY`.

## 데스크톱(Electron) — Windows 설치파일

`desktop/` (main·preload·launch·ollama) + `package.json` electron-builder 설정. prod 는 Next.js
`output: standalone` 서버를 **메인 프로세스에서 직접 require** 해 구동(자식 프로세스·`ELECTRON_RUN_AS_NODE`
의존 제거)하고, Electron 창이 `127.0.0.1:38520` 을 로드한다.

```bash
npm run electron:dev     # next dev + Electron 창(localhost:3000 로드)
npm run electron:build   # next build → prepare-server(standalone 조립) → electron-builder(NSIS)
```

산출물: `dist/GoldenTube Setup 0.1.0.exe` (약 140MB). 빌드 파이프라인:
1. `next build` → `.next/standalone`
2. `scripts/prepare-server.mjs` → `build-resources/server` (standalone + .next/static + public, robocopy 로 견고하게)
3. `electron-builder` → `build-resources/server` 를 `extraResources` 로 동봉, NSIS 설치파일 생성

**무료 로컬 AI(터미널 없이)**: 설정 화면의 데스크톱 전용 카드에서 버튼만 누르면 `desktop/ollama.js` 가
Ollama 설치 확인/winget 설치 → `OLLAMA_MODELS` ASCII 경로 고정 → 서버 재기동 → 모델 pull(진행률 표시)을
IPC 로 수행(기존 `setup_env.py` 패턴 포팅).

> ⚠️ VS Code/Electron 환경의 통합 터미널에서 앱을 직접 실행하면 상속된 `ELECTRON_RUN_AS_NODE=1` 때문에
> Electron 이 Node 로 동작해 창이 안 뜰 수 있다(설치한 일반 사용자는 무관). 그 경우 해당 환경변수를 비우고 실행.

## 스택 (OnTone 파이프라인 재활용)

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4
- AI: 로컬 Ollama(Gemma) 또는 Claude API(`@anthropic-ai/sdk`) — 위 엔진 참고
- 데스크톱: Electron 33 + electron-builder

## 실행

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY 입력
npm run dev                  # http://localhost:3000
```

`ANTHROPIC_API_KEY`는 https://console.anthropic.com 에서 발급. 모델은 `.env.local`로 오버라이드 가능.

## 구조

```
src/
  app/
    page.tsx              랜딩(시니어 카피·작동방식·시작법·요금제)
    onboarding/page.tsx   내 채널·말투 설정(큰 글씨, 쉬운 말)
    studio/page.tsx       3단계 위저드(주제 → 시작·길이 → 영상 한 편 패키지)
    api/
      extract-voice/      평소 말투 → 내 말투 지침 정리
      generate/           프로필+주제 → 영상 한 편 패키지(JSON)
  lib/
    types.ts      BrandProfile / 시작법 / 길이 / GeneratedScript(확장)
    prompts.ts    말투 정리·영상 패키지 생성 프롬프트
    plans.ts      요금제(영상 편수 종량)
    store.ts      localStorage 저장 + 월 사용량 카운트(MVP)
    anthropic.ts  Claude 클라이언트 + 모델 설정
```

## 로드맵

**완료: 텍스트 패키지** — 제목·대본·썸네일 글자·설명·태그·챕터·수익화 코칭

**완료: 영상(.mp4) 자동 제작 (데스크톱)** — 장면 분할 → 무료 AI 그림 + 무료 TTS + 자막 →
로컬 ffmpeg 조립. 장면마다 켄번즈 4종(줌인/줌아웃/좌우 팬) 순환 + 페이드 전환,
배경음악(내 음악 파일, `video:pickBgm`) 저음량(0.14) 믹싱 + 엔딩 페이드아웃.

**완료: 썸네일 이미지 자동 생성** — 스튜디오 결과 화면에서 무료 그림 AI 배경 +
`thumbnailText` 큰 글자(노랑+검정 외곽선, 자동 줄바꿈·크기 조절) 캔버스 합성 → PNG 저장.
클라이언트 캔버스 방식이라 웹에서도 작동.

**그 이후**
- [ ] Supabase 인증 + 프로필/사용량 DB 이전 (현재 localStorage)
- [ ] 결제 연동(토스페이먼츠) → 실제 구독
- [ ] 자막(SRT) 다운로드, TTS 음성, 채널 다중 관리
- [ ] 복지관·평생교육원 강사용 교안·단체 라이선스(교실 플랜)

## 의도적 제외

웹(Vercel)에서의 영상 렌더링은 제외 — ffmpeg 렌더링은 데스크톱 앱 전용이고,
웹에서는 텍스트 패키지 + 썸네일 생성까지 제공하며 무료 앱 다운로드로 안내합니다.
