# Story 010: 출시 다듬기

> **Epic**: moyeogongbu
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-11-11

## Context

**GDD**: `design/game-brief.md`
**Requirement**: 배포 전 마무리 (2026-11-10 사용자 요청: 덜 된 곳, 어색한 곳, 깨지기 쉬운 곳을 고쳐 바로 쓸 수 있는 완성본으로)

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none (React 19 + Vite 웹 앱) | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

## Acceptance Criteria

- [x] 개발 중에 넣어 둔 예시 공지 네 개를 지우고, 지금 있는 기능만 알리는 공지 네 개를 올린다 (`20261111100000_launch_notices.sql`).
- [x] 학교 테마는 출시 범위에서 빼고 로비 모니터에서 숨긴다. 공용 카페와 백색소음은 Story 011, 012에서 만든다.
- [x] 동작을 풀어 쓰는 설명 문장을 걷어 낸다: 공부 기록, 방 목록, 설정, 첫 화면, 회사 방 이동 도움말. 꼭 필요한 오류와 되돌릴 수 없는 일의 확인만 남긴다.
- [x] 친구 목록: 친구가 꾸민 모습(`list_friends`의 `look`, `20261111110000_friend_looks.sql`), 지금 상태와 장소, 같은 방 멤버면 "같이 공부하기", 내 친구 코드 복사. 로비 휴대폰도 같은 모습을 쓴다.
- [x] 친구 창: 친구 끊기와 차단은 한 번 더 묻는다.
- [x] 설정: 계정(화면 이름, 친구 코드 복사), 알림(브라우저 권한 상태), 차단 목록 묶음. 로그아웃과 계정 삭제는 아래 줄.
- [x] 방 목록: 초대 코드 복사, 방 나가기는 한 번 더 묻고, 방장이면 나간 뒤 어떻게 되는지 알려 준다.
- [x] 방장 도구: 방 오른쪽 열의 단추가 창을 연다. 묶음(방 정보, 화이트보드, 휴게실 꾸미기, 멤버)마다 카드, 멤버 얼굴, 강퇴는 한 번 더 묻는다.
- [x] "로비"라고 부르던 곳을 화면 문구에서 "내 방"으로 통일한다.

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

## Test Evidence

`production/qa/evidence/story-010-launch-polish/` (1440×900): friends, friend-detail, friend-detail-confirm, settings, lobby, rooms, records, welcome, owner-closed, owner-top, owner-message, owner-buy-confirm, owner-bottom.
자동 테스트: `tests/room-decor.test.mjs`, `tests/room-realtime.test.mjs`(방장 도구 창, 강퇴 확인), `tests/room-list.test.mjs`(방 나가기 확인), `tests/friends.test.mjs`.

## Dependencies

- `production/epics/moyeogongbu/story-004-realtime-room.md`
- `production/epics/moyeogongbu/story-006-friends-mail.md`
- `production/epics/moyeogongbu/story-007-shop-customize.md`

## Files

- supabase/migrations/20261111100000_launch_notices.sql
- supabase/migrations/20261111110000_friend_looks.sql
- src/features/friends/model/friends.ts
- src/features/friends/view/FriendsPage.tsx, FriendList.tsx, FriendDetail.tsx, BlockList.tsx, friends.css
- src/features/character/view/CharacterAvatar.tsx, characterAvatar.css
- src/features/shell/view/Dialog.tsx, CopyButton.tsx, controls.css, PageFrame.tsx
- src/features/account/view/SettingsPanel.tsx, settings.css, DisplayNameField.tsx, WelcomePage.tsx, authFrame.css
- src/features/room/view/OwnerTools.tsx, ownerTools.css, MyRoomList.tsx, roomList.css
- src/features/rooms/view/CompanyRoomPage.tsx, src/study/CompanyRoom.jsx, src/study/study.css
- src/features/lobby/view/RoomMonitor.tsx, lobby.css
- src/features/records/view/RecordsPage.tsx, src/features/guide/model/guide.ts, src/features/legal/view/PrivacyPage.tsx
- src/styles.css
- tests/room-decor.test.mjs, tests/room-realtime.test.mjs, tests/room-list.test.mjs, tests/coins-browser.test.mjs, tests/company-room.test.mjs, tests/supabaseMock.mjs
