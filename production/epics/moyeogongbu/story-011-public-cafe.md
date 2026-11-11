# Story 011: 공용 스터디카페

> **Epic**: moyeogongbu
> **Status**: Complete
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-11-11

## Context

**GDD**: `design/game-brief.md`
**Requirement**: 공용 스터디카페를 지금 만든다 (2026-11-10 사용자 결정: 초대 코드 없이 누구나 들어오는 실시간 공용 방, 새 카페 그림과 좌석 배치)

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none (React 19 + Vite 웹 앱) | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

## Acceptance Criteria

- [x] 카페는 `rooms` 줄(`kind = 'cafe'`)이다. 방장과 초대 코드가 없고, 좌석 6개와 동시 인원 6명은 회사 방 규칙과 같다 (`20261112100000_public_cafe.sql`).
- [x] `join_cafe`: 친구가 있는 카페(`?with=`), 이미 있던 카페, 자리가 남은 카페 가운데 사람이 가장 많은 곳 순서로 고르고, 모두 차면 새 카페를 연다. 한 사람은 카페 하나에만 있다. 가득 찬 친구 카페는 "그 카페는 자리가 다 찼어요."
- [x] 카페 멤버는 지금 그 카페에 있는 사람이다. 접속이 유예보다 오래 끊기면 `room_sweep`이 뺀다. 카페는 내 방 목록에 나오지 않고, 방장 도구와 친구 초대가 없다.
- [x] 카페 그림 672×432: 벽과 바닥, 탁자와 의자, 카운터, 표지판, 시계판, 노트북은 `tools/art/cafe-room.mjs`가 칸마다 그리고, 물건(에스프레소 기계, 그라인더, 빵 진열장, 선반, 칠판, 걸이 화분, 조명, 문, 소파, 스탠드, 협탁, 책장, 화분)은 따로 만든 그림을 빈 바닥에 놓는다. 완성 그림에서 떼어 쓰지 않는다.
- [x] 회사 방과 같은 이동, 좌석, 책상 세트, 반응, 할 일, 공부 세션, 정산을 쓴다 (`LiveStudyRoom`, `roomScene.js`). 카페 문구: 카운터로 가기, 나가기, 오늘 공부, 정산의 공부 시간.
- [x] 로비 모니터에 카페 줄과 지금 인원(`cafe_count`), 친구 목록에 "공용 스터디카페에서 공부 중"과 그 카페로 가는 "같이 공부하기".
- [x] 들어가지 못했을 때(가득 참, 멤버 아님, 연결 실패)는 방 자리 가운데 카드와 단추 두 개(다시 들어가기 또는 방 목록, 내 방으로). 회사 방도 같은 카드.
- [x] 옛 테마 둘러보기 화면(`/themes/...`)과 카페 자리 고르기 화면을 지운다.
- [x] 고친 버그: 로비 모니터 틀 스타일(`.desk-monitor`)이 방 책상 모니터에 번져 검은 틀이 생기던 문제. 방 쪽 이름을 `.desk-screen`으로 바꿨다.

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

## Test Evidence

`production/qa/evidence/story-011-public-cafe/`: cafe-seated, friends-in-cafe, cafe-two-people, cafe-full.
자동 테스트: `tests/cafe.test.mjs`(로비에서 들어가 앉기, 친구 따라가기, 내 방 목록에 없음, 여섯 명이면 옆 카페, 가득 찬 친구 카페).

## Dependencies

- `production/epics/moyeogongbu/story-004-realtime-room.md`
- `production/epics/moyeogongbu/story-006-friends-mail.md`

## Files

- supabase/migrations/20261112100000_public_cafe.sql
- tools/art/cafe-room.mjs, art-src/rooms/cafe-room.png, art-src/rooms/cafe-laptop.png, art-src/rooms/cafe/objects/
- public/assets/rooms/cafe-room.png, public/assets/rooms/cafe-laptop.png
- src/study/cafeLayout.js, roomScene.js, CompanyRoom.jsx, CharacterSprite.jsx, DeskSet.jsx, WallClock.jsx, study.css
- src/features/rooms/view/LiveStudyRoom.tsx, RoomNotice.tsx, CafePage.tsx, CompanyRoomPage.tsx
- src/features/rooms/viewmodel/useRoomRoutes.ts, useRoomNavigation.ts; src/features/rooms/model/rooms.ts
- src/features/room/model/room.ts, roomStore.ts; src/features/room/viewmodel/useRoomLive.ts, useMyRooms.ts; src/features/room/view/RemoteCharacter.tsx
- src/features/friends/model/friends.ts; src/features/friends/view/FriendList.tsx, FriendDetail.tsx
- src/features/lobby/view/RoomMonitor.tsx, lobby.css
- src/features/session/view/StudySessionBar.tsx; src/features/coins/view/SettlementCard.tsx
- src/features/shell/model/paths.ts, menu.ts; src/app/router.tsx; src/styles.css
- tests/cafe.test.mjs, tests/supabaseMock.mjs, tests/app.test.mjs, tests/company-room.test.mjs, tests/desk-set.test.mjs
