# Story 004: 실시간 6석 회사 방

> **Epic**: moyeogongbu
> **Status**: Complete
> **Layer**: Core
> **Type**: Integration
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-10-30

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 2

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none (React 19 + Vite 웹 앱) | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

- [x] 방을 만들 수 있다 (한 사람당 최대 3개). 방은 6석 고정이고 6자리 초대 코드로 입장한다.
- [x] 초대 코드로 한 번 들어온 방은 "내 방 목록"에 남아 다음부터 바로 들어간다. 방 멤버는 최대 6명이고 "방 나가기"를 할 수 있다.
- [x] 동시에 방에 있을 수 있는 사람은 6명이다. 7번째 사람에게는 "방이 가득 찼어요"를 보여 준다.
- [x] 방장은 방 이름 변경, 초대 코드 재발급, 강퇴를 할 수 있다. 강퇴된 사람은 멤버에서 빠지고, 방장이 풀어 주기 전에는 같은 코드로 다시 들어올 수 없다.
- [x] 좌석 점유는 서버가 판정한다. 두 사람이 같은 자리를 동시에 눌러도 한 명만 앉는다.
- [x] 다른 사람의 이동은 목적지만 전송하고, 각 화면이 같은 경로를 계산해 걷는 모습을 재생한다.
- [x] 같은 방 캐릭터 머리 위에 화면 이름이 작게 보인다. 마우스를 올리면 상태(공부 중, 휴식, 화장실), 오늘 공부 시간, "지금 하는 일"(공개한 경우)이 보인다.
- [x] 정해진 반응만 보낼 수 있다: 이모지 6개(👍 🔥 👏 ☕ 💪 ❤️)와 응원 문구 3개("화이팅", "수고했어요", "잠깐 쉬어요"). 머리 위에 3초 동안 뜨고, 같은 사람은 5초에 한 번만 보낸다. 자유 채팅은 없다.
- [x] 연결이 끊기면 그 순간 공부 시간 측정이 멈춘다. 2분 안에 다시 연결되면 같은 자리에서 이어지고, 넘으면 좌석이 풀린다.
- [x] 기존 이동, 착석, 휴게실, 화장실, 퇴근 동작과 파티션 충돌 처리가 그대로 동작한다.
- [x] 6명이 동시에 있어도 화면 이동이 끊기지 않는다.
- [x] 계정을 삭제하면 그 사람이 방장인 방은 가장 오래 함께한 사람에게 넘어가고, 남은 사람이 없으면 방이 삭제된다.
- [x] 브라우저 localStorage의 로컬 방 목록과 데모 초대 방 `MOYEO6`은 걷어 내고 이관하지 않는다.

---

## Implementation Notes

- 기존 `seatService.js` 인터페이스("서버 도입 시 교체")를 서버 저장소로 바꾼다. IndexedDB 트랜잭션 자리를 DB 제약과 함수가 대신한다.
- 위치와 상태 공유는 Supabase Realtime 전용 모듈 하나로 둔다.
- 재연결 유예 2분, 반응 표시 3초, 반응 간격 5초, 반응 목록은 설정 파일로 분리한다. 반응은 나중에 픽셀아트 아이콘으로 바꿀 수 있게 둔다.
- 경로 계산이 결정적이라 같은 출발점과 목적지면 같은 경로가 나온다는 점에 기댄다.
- 방 안의 픽셀아트는 지금 이미지를 쓴다. 새 픽셀아트로 바꿔도 상대 좌표라 기능 코드는 그대로 쓸 수 있어야 한다.

---

## Out of Scope

- Story 006: 친구 추가와 방 초대 우편
- 공용 스터디카페, 학교 테마
- 방 꾸미기 슬롯

---

## Files

- `src/app/router.tsx`
- `src/features/lobby/viewmodel/useTasks.ts`
- `src/features/room/model/room.ts`
- `src/features/room/model/roomConfig.ts`
- `src/features/room/model/roomRealtime.ts`
- `src/features/room/model/roomRules.ts`
- `src/features/room/model/roomStore.ts`
- `src/features/room/view/MyRoomList.tsx`
- `src/features/room/view/OwnerTools.tsx`
- `src/features/room/view/RemoteCharacter.tsx`
- `src/features/room/view/RoomLiveBar.tsx`
- `src/features/room/viewmodel/useCurrentTask.ts`
- `src/features/room/viewmodel/useMyRooms.ts`
- `src/features/room/viewmodel/useOwnerTools.ts`
- `src/features/room/viewmodel/useRoomLive.ts`
- `src/features/rooms/model/rooms.ts`
- `src/features/rooms/view/CompanyRoomPage.tsx`
- `src/features/rooms/view/RoomListPage.tsx`
- `src/features/rooms/viewmodel/useRoomNavigation.ts`
- `src/features/rooms/viewmodel/useRoomRoutes.ts`
- `src/features/shell/model/paths.ts`
- `src/features/shell/viewmodel/AppStateContext.ts`
- `src/features/shell/viewmodel/AppStateProvider.tsx`
- `src/study/CharacterSprite.jsx`
- `src/study/CompanyRoom.jsx`
- `src/study/RoomList.jsx`
- `src/study/rooms.js`
- `src/study/seatService.js`
- `src/study/study.css`
- `src/study/useCharacterMovement.js`
- `src/study/useRooms.js`
- `src/study/useSeatOccupancy.js`
- `supabase/migrations/20261030100000_rooms.sql`
- `tests/movement-browser.test.mjs`
- `tests/room-list.test.mjs`
- `tests/room-realtime.test.mjs`
- `tests/rooms.test.mjs`
- `tests/supabaseMock.mjs`

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: 두 계정이 같은 방에 있는 화면의 retained screenshot을 `production/qa/evidence/`에 남긴다. 통합 테스트 또는 playtest 문서는 `qa.level: minimal`이라 권장이다.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/moyeogongbu/story-001-account-foundation.md`, `production/epics/moyeogongbu/story-002-study-session.md`
- Unlocks: `production/epics/moyeogongbu/story-006-friends-mail.md`

## Completion Notes
**Completed**: 2026-10-30
**Criteria**: 13/13 passing (none deferred). 방 3개 제한, 멤버 6명, 강퇴와 해제, 코드 재발급, 좌석 경쟁(두 세션 동시 요청), 2분 유예 뒤 좌석 해제, 방 사이 RLS, 같은 방 멤버만 상태 조회, 계정 삭제 시 방장 이전과 빈 방 삭제를 로컬 Postgres SQL로 점검했다. 실시간 이동, 반응, 이름표는 가짜 Realtime 서버로 두 브라우저에서 확인했다.
**Deviations**: ADVISORY, 반응과 "지금 하는 일" 입력, 방장 도구는 방 그림 아래에 둔다(툴바에 두면 방 그림이 화면 밖으로 밀림). 멤버가 6명으로 제한되어 동시 접속 7번째(`room_full`)는 실제로 생기지 않고 가입 단계(`members_full`)에서 막히며 둘 다 "방이 가득 찼어요"로 보인다. "지금 하는 일"은 새 표 `study_current_tasks`에 둔다. 방 채널은 공개 채널이라 보낸 사람 표시를 받는 쪽에서 방 멤버 여부로 거른다(비공개 채널 전환은 후속 보안 작업). 방 주소는 `/rooms/:roomId`. 로비 할 일 체크가 서버 저장 전 다시 불러오기에 덮이던 경쟁 상태를 고쳤다(Story 003 회귀).
**Test Evidence**: `production/qa/evidence/story-004-realtime-room/`, `tests/room-realtime.test.mjs`, `tests/rooms.test.mjs`, 전체 45/45 두 번 통과.
**Reviewed by**: self, no independent review
