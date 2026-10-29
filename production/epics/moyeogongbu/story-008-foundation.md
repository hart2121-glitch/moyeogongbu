# Story 008: 기반 구조

> **Epic**: moyeogongbu
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Integration
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-10-29

*번호는 008이지만 Story 001보다 먼저 끝낸다. 001에서 나눈 스토리라 번호를 다시 매기지 않았다.*

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 1 (빌드 순서 1~2단계, 001에서 분리)

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none (React 19 + Vite 웹 앱) | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

- [ ] TypeScript가 설정되어 있고 새 파일은 `.ts`/`.tsx`로 쓴다. 기존 `.jsx`는 그대로 동작하고 `npm run build`가 통과한다.
- [ ] `src/features/<기능>/{model,viewmodel,view}` 구조가 있고, `main.jsx`의 로비, 메뉴, 모달, 상점 상태가 화면별로 나뉘어 있다.
- [ ] 주소 라우팅(`/lobby`, `/rooms/:code`, `/records` 등)이 동작하고, 새로고침해도 같은 화면에 머문다.
- [ ] TanStack Query가 연결되어 있고 ViewModel 훅 안에서만 쓴다.
- [ ] Supabase 개발과 운영 프로젝트가 분리되어 있고, 환경 변수로 전환된다. 키는 저장소에 들어가지 않는다.
- [ ] DB 변경은 `supabase/migrations/`의 마이그레이션 파일로 기록되고, 로컬 Supabase(Docker)에서 재현된다.
- [ ] GitHub Actions가 PR마다 빌드, 단위 테스트, 브라우저 테스트를 돌린다. 테스트는 `/usr/bin/chromium` 고정 경로 없이 CI에서도 실행된다.
- [ ] Vercel이 PR마다 미리보기 주소를 만든다.
- [ ] 로비, 회사 방, 기존 기능의 겉모습과 동작이 리팩터링 전과 같다 (기존 테스트 통과, 전후 캡처 비교).

---

## Implementation Notes

- Model은 React를 모르는 순수 로직과 주입되는 저장소, ViewModel은 커스텀 훅, View는 그리기만 한다.
- 기존 좌표와 경로 코드(`companyFinalLayout.js`, `navigation.js`, `pathfinding.js`)는 급하게 TypeScript로 바꾸지 않는다.
- 화면에 보이는 변화가 없어야 하는 리팩터링이므로, 전후 캡처를 비교해 증거로 남긴다.

---

## Out of Scope

- Story 001: 로그인, 프로필, 계정 삭제
- 데이터 테이블 설계 (각 스토리가 필요한 테이블을 마이그레이션으로 추가)

---

## Files

- `.github/workflows/tests.yml`
- `src/app/App.tsx`
- `src/app/queryClient.ts`
- `src/app/router.tsx`
- `src/features/character/model/character.ts`
- `src/features/character/view/CharacterPage.tsx`
- `src/features/character/view/ProfileForm.tsx`
- `src/features/character/viewmodel/useCharacter.ts`
- `src/features/friends/model/friends.ts`
- `src/features/friends/view/FriendDetail.tsx`
- `src/features/friends/view/FriendList.tsx`
- `src/features/friends/view/FriendsPage.tsx`
- `src/features/guide/model/guide.ts`
- `src/features/guide/view/GuidePage.tsx`
- `src/features/lobby/model/notices.ts`
- `src/features/lobby/model/tasks.ts`
- `src/features/lobby/view/LobbyPage.tsx`
- `src/features/lobby/view/NoticeDetail.tsx`
- `src/features/lobby/view/NoticeList.tsx`
- `src/features/lobby/view/TaskForm.tsx`
- `src/features/lobby/viewmodel/useTasks.ts`
- `src/features/lobby/viewmodel/useTip.ts`
- `src/features/records/view/RecordsPage.tsx`
- `src/features/rooms/model/rooms.ts`
- `src/features/rooms/view/CafePage.tsx`
- `src/features/rooms/view/CompanyRoomPage.tsx`
- `src/features/rooms/view/RoomListPage.tsx`
- `src/features/rooms/view/ThemeRoomPage.tsx`
- `src/features/rooms/viewmodel/useRoomNavigation.ts`
- `src/features/rooms/viewmodel/useRoomRoutes.ts`
- `src/features/shell/model/menu.ts`
- `src/features/shell/model/modal.ts`
- `src/features/shell/model/paths.ts`
- `src/features/shell/model/toast.ts`
- `src/features/shell/view/AppShell.tsx`
- `src/features/shell/view/ModalHost.tsx`
- `src/features/shell/view/PageFrame.tsx`
- `src/features/shell/view/Panel.tsx`
- `src/features/shell/view/Sidebar.tsx`
- `src/features/shell/view/Toast.tsx`
- `src/features/shell/view/TopBar.tsx`
- `src/features/shell/viewmodel/AppStateContext.ts`
- `src/features/shell/viewmodel/AppStateProvider.tsx`
- `src/features/shell/viewmodel/useModal.ts`
- `src/features/shell/viewmodel/useToast.ts`
- `src/features/shop/model/shop.ts`
- `src/features/shop/view/ShopPage.tsx`
- `src/features/shop/viewmodel/useShop.ts`
- `src/lib/supabase.ts`
- `src/vite-env.d.ts`
- `supabase/.gitignore`
- `supabase/README.md`
- `supabase/config.toml`
- `supabase/migrations/.gitkeep`
- `tsconfig.json`
- `vercel.json`
- `.gitignore`
- `package-lock.json`
- `package.json`
- `src/main.jsx`

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: 리팩터링 전후 로비와 회사 방의 retained screenshot을 `production/qa/evidence/`에 남긴다. CI 통과 기록. 테스트는 `qa.level: minimal`이라 권장이다.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: `production/epics/moyeogongbu/story-001-account-foundation.md`

## Completion Notes
**Completed**: 2026-10-29
**Criteria**: 9/9 passing (none deferred)
**Deviations**: ADVISORY, `src/features/shop/model/shop.ts`의 임시 상품과 시작 코인은 리팩터링 전 `main.jsx` 값을 그대로 옮긴 것이며 Story 007에서 교체된다.
**Test Evidence**: `production/qa/evidence/story-008-foundation/` (전후 캡처, 운영 배포 캡처), CI 통과. 테스트 파일은 qa.level minimal이라 면제.
**Reviewed by**: self, no independent review
