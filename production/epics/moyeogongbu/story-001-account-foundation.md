# Story 001: 계정

> **Epic**: moyeogongbu
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-10-30

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 1

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none (React 19 + Vite 웹 앱) | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

- [x] Google 로그인과 로그아웃이 동작하고, 새로고침해도 로그인 상태가 유지된다. 게스트 입장은 없다.
- [x] 처음 로그인하면 화면 이름(1~12자)을 정하는 단계가 나오고, 설정에서 바꿀 수 있다. 로비의 이름 표시는 코드에 박힌 예시 값이 아니라 프로필에서 온다.
- [x] 가입 시 계정마다 고정된 8자 친구 코드가 발급된다 (재발급 없음). 내부 식별은 Supabase 계정 UUID다.
- [x] 설정에서 계정 삭제를 하면 계정과 프로필이 지워지고 로그아웃된다. 다른 데이터의 삭제는 그 데이터를 만드는 스토리가 붙인다.
- [x] 개인정보 처리방침 페이지(`/privacy`)가 있고, 로그인 없이 열린다. 내용은 사용자가 승인한 `docs/legal/privacy-policy-draft.md`(개인정보보호위원회 작성지침 목차)이며, 실제로 처리하는 항목(이메일, 화면 이름, Google 계정 이름과 프로필 사진 주소, 접속 기록)과 국외 이전을 밝힌다.
- [x] 다른 사람의 프로필을 수정하거나 지울 수 없도록 행 단위 보안 규칙이 걸려 있다.
- [x] 로비의 배치와 디자인은 바뀌지 않았다 (문구 정리만 허용).

---

## Implementation Notes

- 개인정보 처리방침 초안(수집 항목, 목적, 보관 기간, 삭제 방법)은 Codex에 위임해 작성한다: 모델 `gpt-6.1-sol`, 추론 강도 `xhigh`. 초안은 사용자가 검토한 뒤 반영한다. 위임 시점에 해당 모델 이름이 Codex CLI에서 유효한지 먼저 확인한다.
- 계정 삭제는 DB 쪽 연쇄 삭제나 함수로 처리하고, 이후 스토리가 자기 데이터의 삭제를 여기에 연결할 수 있게 둔다.
- 화면 이름과 새 문구에는 가운뎃점을 쓰지 않는다.

---

## Out of Scope

- Story 008: TypeScript, MVVM 구조, 라우팅, Supabase 환경, CI
- Story 004: 방장 권한 이전과 빈 방 삭제
- Story 006: 친구 관계 삭제
- 카카오 로그인 (Google 이후)

---

## Files

- `.github/workflows/tests.yml`
- `src/app/App.tsx`
- `src/app/router.tsx`
- `src/features/account/model/account.ts`
- `src/features/account/model/accountStore.ts`
- `src/features/account/view/AuthFrame.tsx`
- `src/features/account/view/DisplayNameField.tsx`
- `src/features/account/view/LoginPage.tsx`
- `src/features/account/view/RequireAccount.tsx`
- `src/features/account/view/SettingsPanel.tsx`
- `src/features/account/view/WelcomePage.tsx`
- `src/features/account/viewmodel/SessionContext.ts`
- `src/features/account/viewmodel/SessionProvider.tsx`
- `src/features/account/viewmodel/useAccount.ts`
- `src/features/character/model/character.ts`
- `src/features/character/view/CharacterPage.tsx`
- `src/features/character/view/ProfileForm.tsx`
- `src/features/character/viewmodel/useCharacter.ts`
- `src/features/legal/model/privacyPolicy.ts`
- `src/features/legal/view/PrivacyPage.tsx`
- `src/features/lobby/view/LobbyPage.tsx`
- `src/features/rooms/viewmodel/useRoomRoutes.ts`
- `src/features/shell/model/paths.ts`
- `src/features/shell/view/ModalHost.tsx`
- `src/styles.css`
- `supabase/migrations/20261029144715_profiles.sql`
- `tests/app.test.mjs`
- `tests/company-room.test.mjs`
- `tests/final-background.test.mjs`
- `tests/movement-browser.test.mjs`
- `tests/room-list.test.mjs`
- `tests/seat-sides-browser.test.mjs`
- `tests/supabaseMock.mjs`
- `tests/walk-down-browser.test.mjs`

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: 로그인, 화면 이름 설정, 설정(계정 삭제), 개인정보 처리방침 화면의 retained screenshot을 `production/qa/evidence/`에 남긴다. 테스트는 `qa.level: minimal`이라 권장이다.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/moyeogongbu/story-008-foundation.md`
- Unlocks: `production/epics/moyeogongbu/story-002-study-session.md`, `production/epics/moyeogongbu/story-004-realtime-room.md`

## Completion Notes
**Completed**: 2026-10-30
**Criteria**: 7/7 passing (none deferred). 실제 Google 로그인, 화면 이름 설정, 로그아웃은 사용자가 localhost:5173에서 개발 프로젝트로 확인했다. 원격 개발과 운영 DB에 마이그레이션이 적용됐다.
**Deviations**: ADVISORY, 처리방침 조건 문구를 실제 처리 항목에 맞게 고쳤다(사용자 승인 초안 기준). `tests/account.test.mjs`는 qa.level minimal이라 만들지 않았다. 기존 브라우저 테스트 7개에 테스트 전용 가짜 세션을 넣었다. 걷기 프레임 테스트의 측정을 속성 변경 기록으로 바꿔 간헐 실패를 없앴다. `movement-browser` 이동 속도 검사는 허용치 경계에서 드물게 실패한다(0.1px 초과, 기존 테스트).
**Test Evidence**: `production/qa/evidence/story-001-account-foundation/` (login, welcome, settings, delete-confirm, privacy, lobby). 테스트 파일은 qa.level minimal이라 면제.
**Reviewed by**: self, no independent review
