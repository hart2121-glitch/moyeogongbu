# Story 006: 친구, 우편함, 알림

> **Epic**: moyeogongbu
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: (set by /dev-story when implementation begins)

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 6

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none (React 19 + Vite 웹 앱) | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

- [ ] 친구 코드(8자)를 입력해 친구 요청을 보낼 수 있다. 닉네임 검색은 없다. 친구는 최대 50명이다.
- [ ] 같은 방에서 다른 사람의 캐릭터를 눌러 친구 요청을 보낼 수 있다.
- [ ] 요청을 받은 사람은 수락, 거절, 차단할 수 있다. 차단한 사람의 요청은 다시 오지 않는다.
- [ ] 친구 끊기는 상대에게 알리지 않는다. 차단하면 친구 관계도 끊기고, 차단 목록은 설정에서 보고 해제할 수 있다.
- [ ] 친구 목록에 각 친구의 상태(공부 중, 휴식)가 보인다. 같은 방 멤버인 친구만 방 이름이 보이고, 아니면 "스터디룸에서 공부 중"처럼 상태만 보인다.
- [ ] 방 멤버는 누구나 친구에게 우편으로 방 초대를 보낼 수 있다. 방이 6명으로 가득 차 있으면 보낼 수 없다.
- [ ] 우편함에 친구 요청, 방 초대, 시스템 보상이 오고 직접 수락하거나 받을 수 있다. 우편은 30일 뒤 자동으로 지워지고, 보상에는 남은 기한이 표시된다.
- [ ] 하루(오전 5시 기준) 첫 착석 때 출석 보상 10코인이 우편으로 온다. 연속 출석 보너스는 없다.
- [ ] 알림(종 아이콘)에 친구가 같은 방에 들어옴, 뽀모도로 종료, 자리 비움 확인이 표시된다.
- [ ] 방 초대를 받은 사람은 우편함에서 바로 방에 입장할 수 있다.
- [ ] 친구와 우편함 데이터는 본인과 관련된 것만 읽고 쓸 수 있도록 서버 규칙으로 막혀 있다.
- [ ] 로비의 친구와 공지 패널 배치와 디자인은 바뀌지 않고 서버 데이터로 연결된다.
- [ ] 계정을 삭제하면 그 사람의 친구 관계, 요청, 차단, 우편이 모두 지워진다.

---

## Implementation Notes

- 친구 코드는 Story 001에서 발급된 값을 쓴다. 재발급은 만들지 않는다.
- 친구 상한 50명, 우편 보관 30일, 출석 보상 10코인은 설정 파일로 분리한다. 출석 코인 지급은 Story 003의 서버 적립 경로를 쓴다.
- 상태 표시는 Story 004의 Realtime 상태를 재사용한다.
- 기존 로비 문구의 가운뎃점(예: 친구 위치 문구)은 이 화면을 작업할 때 글자만 바꾼다.

---

## Out of Scope

- 자유 텍스트 채팅
- 친구 간 순위나 공부 시간 비교

---

## Files

- `src/features/friends/`
- `src/features/mailbox/`
- `src/features/notifications/`
- `supabase/migrations/`
- `tests/friends.test.mjs`

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: 친구 목록, 우편함, 알림 화면의 retained screenshot을 `production/qa/evidence/`에 남긴다. 통합 테스트 또는 playtest 문서는 `qa.level: minimal`이라 권장이다.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/moyeogongbu/story-004-realtime-room.md`
- Unlocks: `production/epics/moyeogongbu/story-007-shop-customize.md`
