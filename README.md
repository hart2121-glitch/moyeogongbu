# 모여공부 (moyeogongbu)

픽셀아트로 그린 PC 웹 온라인 스터디 서비스입니다. 내 방(집)에서 하루를 시작해 친구와 만든 회사 방에 출근하거나, 누구나 들어오는 공용 스터디카페에서 함께 공부합니다. 앉아서 공부한 시간만큼 코인을 받고, 코인으로 캐릭터와 내 방을 꾸밉니다.

제품 정의와 합의된 결정은 `design/game-brief.md`, 작업 규칙은 `AGENTS.md`에 있습니다.

## 할 수 있는 것

- **로그인**: Google 계정. 처음 들어오면 화면 이름을 정하고 기본 꾸밈을 고릅니다.
- **내 방**: 오늘의 할 일 메모, 모니터(갈 곳 고르기), 휴대폰(친구), 공지. 가구와 벽지, 바닥을 꾸밀 수 있습니다.
- **회사 스터디룸**: 방을 만들거나 초대 코드로 들어갑니다. 한 방에 6명, 6석. 캐릭터가 걸어가 앉고, 휴게실과 화장실에 다녀오고, 서로 반응을 보냅니다. 방장은 이름, 초대 코드, 화이트보드, 휴게실 꾸밈, 멤버를 관리합니다.
- **공용 스터디카페**: 초대 코드 없이 누구나 들어오는 실시간 공부방. 한 카페에 6명, 자리가 차면 옆 카페가 열립니다. 친구 목록에서 카페에 있는 친구를 따라갈 수 있습니다.
- **공부 세션**: 앉아 있는 동안 공부 시간이 쌓이고, 뽀모도로, 자리 비움 확인, 퇴근 정산이 있습니다.
- **방 소리**: 빗소리, 키보드, 카페 소리와 음량. 고른 것은 이 브라우저에 기억합니다.
- **코인과 꾸미기**: 공부 1분에 1코인, 끝낸 할 일 하나에 2코인. 캐릭터 꾸미기에서 입어 보고 삽니다.
- **공부 기록**: 달력과 하루별 공부 시간, 할 일.
- **친구**: 친구 코드로 추가, 상태와 있는 곳, 같이 공부하기, 우편함(친구 요청, 방 초대, 선물), 알림, 차단.

## 기술

React 19, Vite 7, TypeScript(일부 JSX), TanStack Query, React Router 7, Supabase(Postgres, Auth, Realtime). 화면 코드는 `src/features/<기능>/{model,viewmodel,view}`로 나누고, 공부방 장면(이동, 좌석, 책상 세트)은 `src/study/`에 있습니다. 서버 규칙은 모두 `supabase/migrations/`의 SQL 함수(RPC)입니다.

## 실행하기

Node.js 22.12 이상과 npm이 필요합니다.

```bash
npm ci
npm run dev
```

앱은 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 읽습니다. 값은 `.env.development.local`(개발), `.env.production.local`(운영)에 두고 저장소에 올리지 않습니다. 로컬 Supabase(Docker 필요)와 마이그레이션은 `supabase/README.md`를 보세요.

1280px 이상 PC 화면을 기준으로 만들었습니다.

## 검사

```bash
npm run typecheck
npm run build
npm test          # 실행 중인 개발 서버를 대상으로 (가짜 Supabase를 씁니다)
```

브라우저 검사는 Playwright Chromium으로 돌고, 서버 응답은 `tests/supabaseMock.mjs`의 가짜 서버가 대신합니다. 개발 서버를 가짜 값으로 띄운 뒤 실행합니다.

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=test-anon-key npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
CHROMIUM_PATH=<chromium 실행 파일> APP_URL=http://127.0.0.1:4173/ npm test
```

`CHROMIUM_PATH`의 기본값은 `/usr/bin/chromium`, `APP_URL`의 기본값은 `http://127.0.0.1:4173/`입니다. GitHub Actions(`.github/workflows/tests.yml`)가 같은 순서로 검사하고 `supabase db reset`으로 마이그레이션도 확인합니다. 화면 증거 스크린샷은 `production/qa/evidence/`에 남깁니다.

## 배포

Vercel 정적 배포입니다 (`vercel.json`: `npm run build`, `dist/`, `/assets/` 밖의 모든 주소를 `index.html`로, 기본 보안 헤더). 환경 변수는 Preview에 개발 프로젝트, Production에 운영 프로젝트 값을 넣습니다. DB 변경은 합친 뒤 `npx supabase db push`로 각 프로젝트에 적용합니다. 처음 출시할 때 대시보드에서 할 일(Google 로그인, 돌아올 주소)은 `supabase/README.md`의 "출시 전 설정"에 있습니다.

배포 뒤 이미 열려 있던 탭이 사라진 화면 파일을 찾으면 한 번 새로고침해 새 파일을 받습니다 (`src/app/RouteError.tsx`).

## 그림과 소리

- 화면 그림은 도트 스프라이트로 다시 그립니다. 원본은 `art-src/`에 무변형 보관하고 화면용 파일은 `public/assets/`에 둡니다. 규칙은 `AGENTS.md`, 검사는 `node tools/art/validate.mjs`, 만드는 스크립트와 순서는 `art-src/README.md`.
- 회사 방 기준 원본과 처리 기록은 `public/assets/rooms/README.md`.
- 카페 소리는 Wikimedia Commons의 CC0 녹음에서 만든 고리입니다 (`public/assets/sounds/README.md`). 빗소리와 키보드 소리는 브라우저에서 합성합니다.

## 만든 방식

개발 과정은 [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) v1.2.0 구조를 따릅니다 (`.claude/`, `design/`, `docs/`, `production/`, MIT, `.claude/CCGS-LICENSE`). 이야기(스토리) 단위 작업 기록은 `production/epics/moyeogongbu/`에 있습니다.

## 라이선스와 출처

- 폰트: Gowun Dodum, Gowun Batang (SIL OFL, `@fontsource` 패키지)
- 아이콘: Phosphor Icons (MIT)
- 카페 소리: "Cafe ambiance", Marble Toast, Wikimedia Commons (CC0 1.0)
- 물건 그림 일부는 PixelLab으로 만든 뒤 손 보정했습니다 (목록은 `art-src/`의 각 README).
