# Story 005: 공부 기록과 날짜별 할 일

> **Epic**: moyeogongbu
> **Status**: Complete
> **Layer**: Feature
> **Type**: UI
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-10-30

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 5

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none (React 19 + Vite 웹 앱) | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

- [x] 공부 기록 화면에 오늘 공부 시간과 받은 코인이 보인다. "오늘"과 할 일의 날짜는 한국 시간 오전 5시 기준이다.
- [x] 최근 7일 막대그래프가 보인다.
- [x] 1년치 잔디형 달력이 하루 공부량을 5단계 진하기(0분, 1시간 미만, 1~3시간, 3~6시간, 6시간 이상)로 보여 준다. 색은 고정 팔레트 안에서 고른다.
- [x] 잔디 칸이나 막대를 누르면 그날의 공부 시간, 받은 코인, 완료한 할 일이 보인다.
- [x] 공부 기록 화면은 본인만 볼 수 있다. 친구와 비교하거나 순위를 매기는 요소는 없다.
- [x] 할 일은 날짜별로 추가, 완료, 삭제할 수 있고 서버에 저장되어 새로고침 후에도 남는다. 하루 30개, 한 개당 1~50자까지다.
- [x] 새 날 처음 할 일을 열면 어제의 미완료 할 일을 보여 주고 "모두 가져오기" 또는 골라서 가져올 수 있다. 가져오지 않은 할 일은 원래 날짜에 남는다. 더 오래된 할 일은 날짜 상세에서 옮긴다.
- [x] 할 일 하나를 현재 세션에 연결하면 "지금 하는 일"로 표시되고, 친구에게 보일지는 사용자가 정한다.
- [x] 할 일 완료 코인은 Story 003의 규칙(개당 2코인, 하루 10개)을 따른다.
- [x] 로비의 기존 할 일 패널 배치와 디자인은 바뀌지 않고 서버 데이터로 연결된다.
- [x] 계정을 삭제하면 그 사람의 할 일이 모두 지워진다.

---

## Implementation Notes

- 기록 집계는 서버 쿼리 결과를 ViewModel 훅에서 TanStack Query로 불러온다.
- 그래프와 달력의 색은 고정 팔레트와 어울리게 정하고, 기록 화면은 `/records` 주소를 쓴다.
- 기록 화면 문구에는 가운뎃점을 쓰지 않는다.
- 잔디 구간 값과 할 일 제한(30개, 50자)은 설정 파일로 분리한다.

---

## Out of Scope

- Story 003: 코인 계산 자체
- Story 006: 친구 상태 목록

---

## Files

- `src/features/lobby/model/tasks.ts`
- `src/features/lobby/model/todos.ts`
- `src/features/lobby/view/LobbyPage.tsx`
- `src/features/lobby/view/TaskForm.tsx`
- `src/features/lobby/viewmodel/useTasks.ts`
- `src/features/records/model/recordMath.ts`
- `src/features/records/model/records.ts`
- `src/features/records/model/recordsConfig.ts`
- `src/features/records/model/recordsStore.ts`
- `src/features/records/model/recordTypes.ts`
- `src/features/records/view/DayDetail.tsx`
- `src/features/records/view/RecordsPage.tsx`
- `src/features/records/view/WeekBars.tsx`
- `src/features/records/view/YearCalendar.tsx`
- `src/features/records/viewmodel/useRecords.ts`
- `src/features/room/view/RoomLiveBar.tsx`
- `src/features/shell/model/modal.ts`
- `src/features/shell/view/ModalHost.tsx`
- `src/features/todos/model/carryOver.ts`
- `src/features/todos/model/dayMath.ts`
- `src/features/todos/model/studyDay.ts`
- `src/features/todos/model/tasks.ts`
- `src/features/todos/model/todoConfig.ts`
- `src/features/todos/model/todos.ts`
- `src/features/todos/model/todoStore.ts`
- `src/features/todos/view/CarryOverForm.tsx`
- `src/features/todos/viewmodel/useCarryOver.ts`
- `src/features/todos/viewmodel/useDayTodos.ts`
- `src/styles.css`
- `supabase/migrations/20261030110000_records_todos.sql`
- `tests/records.test.mjs`
- `tests/records-browser.test.mjs`
- `tests/supabaseMock.mjs`

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: UI
**Required evidence**: 공부 기록 화면, 할 일 패널의 retained screenshot을 `production/qa/evidence/`에 남긴다.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/moyeogongbu/story-003-coin-settlement.md`
- Unlocks: None

## Completion Notes
**Completed**: 2026-10-30
**Criteria**: 11/11 passing (none deferred). 오전 5시 경계 집계, 날짜 상세, 하루 30개 제한, 가져오기 규칙(본인, 미완료, 상한), 본인 전용 조회, 계정 삭제를 로컬 Postgres SQL로 점검했다.
**Deviations**: ADVISORY, 새 할 일은 항상 오늘 날짜로 추가된다(지난 날짜는 완료, 삭제, 오늘로 옮기기만). 할 일 완료 코인은 완료한 날에 쌓인다(Story 003 규칙). 할 일 모델을 `src/features/todos/`로 옮겼다. 로비 친구 목록의 기존 가운뎃점 문구는 이 스토리 범위 밖이라 남겼다. 전체 테스트를 한꺼번에 돌릴 때 Story 004의 두 브라우저 좌석 경쟁 테스트가 드물게 시간 초과된다(단독 5/5 통과).
**Test Evidence**: `production/qa/evidence/story-005-records-todos/`, `tests/records.test.mjs`, `tests/records-browser.test.mjs`, 전체 53/53 통과.
**Reviewed by**: self, no independent review
