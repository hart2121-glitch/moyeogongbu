# Story 005: 공부 기록과 날짜별 할 일

> **Epic**: moyeogongbu
> **Status**: Ready
> **Layer**: Feature
> **Type**: UI
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: (set by /dev-story when implementation begins)

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

- [ ] 공부 기록 화면에 오늘 공부 시간과 받은 코인이 보인다. "오늘"과 할 일의 날짜는 한국 시간 오전 5시 기준이다.
- [ ] 최근 7일 막대그래프가 보인다.
- [ ] 1년치 잔디형 달력이 하루 공부량을 5단계 진하기(0분, 1시간 미만, 1~3시간, 3~6시간, 6시간 이상)로 보여 준다. 색은 고정 팔레트 안에서 고른다.
- [ ] 잔디 칸이나 막대를 누르면 그날의 공부 시간, 받은 코인, 완료한 할 일이 보인다.
- [ ] 공부 기록 화면은 본인만 볼 수 있다. 친구와 비교하거나 순위를 매기는 요소는 없다.
- [ ] 할 일은 날짜별로 추가, 완료, 삭제할 수 있고 서버에 저장되어 새로고침 후에도 남는다. 하루 30개, 한 개당 1~50자까지다.
- [ ] 새 날 처음 할 일을 열면 어제의 미완료 할 일을 보여 주고 "모두 가져오기" 또는 골라서 가져올 수 있다. 가져오지 않은 할 일은 원래 날짜에 남는다. 더 오래된 할 일은 날짜 상세에서 옮긴다.
- [ ] 할 일 하나를 현재 세션에 연결하면 "지금 하는 일"로 표시되고, 친구에게 보일지는 사용자가 정한다.
- [ ] 할 일 완료 코인은 Story 003의 규칙(개당 2코인, 하루 10개)을 따른다.
- [ ] 로비의 기존 할 일 패널 배치와 디자인은 바뀌지 않고 서버 데이터로 연결된다.
- [ ] 계정을 삭제하면 그 사람의 할 일이 모두 지워진다.

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

- `src/features/records/model/`
- `src/features/records/viewmodel/`
- `src/features/records/view/`
- `src/features/todos/`
- `tests/records.test.mjs`

---

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
