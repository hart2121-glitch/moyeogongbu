# Story 003: 시급 코인과 퇴근 정산

> **Epic**: moyeogongbu
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-10-30

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 4

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none (React 19 + Vite 웹 앱) | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

- [x] 공부 시간은 초 단위로 쌓이고, 다 찬 1분마다 1코인이 지급된다 (시급 60코인). 남은 초는 그날 안에서 다음 세션으로 이어지고, 오전 5시에 버려진다.
- [x] 하루 상한은 10시간(600코인)이다. 넘는 시간은 기록에 남고 코인은 주지 않는다. 하루는 한국 시간 오전 5시에 바뀐다.
- [x] 공부 시간이 20분 이상인 뽀모도로 사이클을 끝까지 마치면 5코인을 더 준다. 하루 최대 10회.
- [x] 할 일을 완료하면 개당 2코인, 하루 최대 10개까지 준다. 완료를 취소하면 받은 코인을 회수한다.
- [x] 모든 수치(시급, 상한, 보너스)는 설정 파일에서 바꿀 수 있고, 코드에 직접 쓰여 있지 않다.
- [x] 코인 적립은 서버가 계산하고 기록한다. 화면에서 값을 보내 조작할 수 없다.
- [x] 앉아 있는 동안 회사 방 툴바에 오늘 근무 시간과 코인이 작게 표시된다. 가운뎃점으로 구분하지 않는다.
- [x] 퇴근하기를 누르면 출입구로 걸어간 뒤 "오늘의 정산" 카드를 한 번 보여 주고 로비로 돌아간다.
- [x] 퇴근하기 없이 창을 닫았다면, 다음 로그인 때 로비 위에 한 번만 뜨는 팝업으로 "지난 정산" 카드(퇴근 카드와 같은 디자인)를 보여 준다. 닫으면 다시 뜨지 않고, 여러 날이 밀렸으면 가장 최근 하루만 보여 준다.
- [x] 로비에는 코인 숫자만 보이고 타이머나 급여 명세서는 고정 요소로 놓이지 않는다. 로비의 배치와 디자인은 그대로다.
- [x] 계정을 삭제하면 그 사람의 코인 잔액과 적립 내역이 모두 지워진다.

---

## Implementation Notes

- 코인 계산(Model)은 순수 함수로 두고 경계값(상한 직전과 직후, 보너스 중복)을 단위 테스트한다.
- 서버 쪽 적립은 DB 함수나 제약으로 처리해 중복 적립을 막는다.
- 정산 카드는 확정 로비 디자인과 무관하게 회사 방 안에서만 쓴다.

---

## Out of Scope

- Story 005: 기록 화면의 그래프와 달력
- Story 007: 코인 사용(상점)

---

## Files

- `src/features/coins/model/coinConfig.ts`
- `src/features/coins/model/coinMath.ts`
- `src/features/coins/model/coins.ts`
- `src/features/coins/model/coinStore.ts`
- `src/features/coins/view/PendingSettlementPopup.tsx`
- `src/features/coins/view/SettlementCard.tsx`
- `src/features/coins/viewmodel/useCoins.ts`
- `src/features/lobby/model/tasks.ts`
- `src/features/lobby/model/todos.ts`
- `src/features/lobby/model/todoStore.ts`
- `src/features/lobby/view/LobbyPage.tsx`
- `src/features/lobby/viewmodel/useTasks.ts`
- `src/features/rooms/view/CompanyRoomPage.tsx`
- `src/features/session/view/StudySessionBar.tsx`
- `src/features/session/viewmodel/useStudySession.ts`
- `src/features/shell/view/TopBar.tsx`
- `src/styles.css`
- `supabase/migrations/20261030090000_coins.sql`
- `tests/app.test.mjs`
- `tests/coins.test.mjs`
- `tests/coins-browser.test.mjs`
- `tests/company-room.test.mjs`
- `tests/supabaseMock.mjs`

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: 툴바 표시와 "오늘의 정산" 카드의 retained screenshot을 `production/qa/evidence/`에 남긴다. 단위 테스트(`tests/coins.test.mjs`)는 `qa.level: minimal`이라 권장이다.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/moyeogongbu/story-002-study-session.md`
- Unlocks: `production/epics/moyeogongbu/story-005-records-todos.md`, `production/epics/moyeogongbu/story-007-shop-customize.md`

## Completion Notes
**Completed**: 2026-10-30
**Criteria**: 11/11 passing (none deferred). 상한, 이월과 오전 5시 리셋, 중복 적립 방지, 뽀모도로 검증, 할 일 적립과 회수, RLS, 정산 표시, 계정 삭제를 로컬 Postgres SQL로 점검했다.
**Deviations**: ADVISORY, 모든 보상 수치는 DB의 `coin_rules` 한 곳에 두고 클라이언트 `coinConfig.ts`는 표시 형식만 가진다. 뽀모도로 검증용 값 두 개(여유 30초, 청구 가능 300초)를 추가했다. 할 일을 서버 테이블(`todos`)로 옮겼다(날짜 이동, 하루 30개, 가져오기는 Story 005). 툴바 문구를 "오늘 근무"로 바꿨다. 상점 화면의 체험 구매는 표시 잔액을 바꾸지 않는다(Story 007에서 교체). 사이드바로 방을 나가도 미정산으로 남아 다음 접속 때 지난 정산이 뜬다.
**Test Evidence**: `production/qa/evidence/story-003-coin-settlement/`, `tests/coins.test.mjs`, `tests/coins-browser.test.mjs`, 전체 42/42 통과.
**Reviewed by**: self, no independent review
