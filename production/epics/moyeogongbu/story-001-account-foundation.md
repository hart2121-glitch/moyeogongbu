# Story 001: 계정

> **Epic**: moyeogongbu
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: (set by /dev-story when implementation begins)

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

- [ ] Google 로그인과 로그아웃이 동작하고, 새로고침해도 로그인 상태가 유지된다. 게스트 입장은 없다.
- [ ] 처음 로그인하면 화면 이름(1~12자)을 정하는 단계가 나오고, 설정에서 바꿀 수 있다. 로비의 이름 표시는 코드에 박힌 예시 값이 아니라 프로필에서 온다.
- [ ] 가입 시 계정마다 고정된 8자 친구 코드가 발급된다 (재발급 없음). 내부 식별은 Supabase 계정 UUID다.
- [ ] 설정에서 계정 삭제를 하면 계정과 프로필이 지워지고 로그아웃된다. 다른 데이터의 삭제는 그 데이터를 만드는 스토리가 붙인다.
- [ ] 개인정보 처리방침 페이지가 있고, 수집 정보는 로그인 이메일과 화면 이름뿐이라고 밝힌다.
- [ ] 다른 사람의 프로필을 수정하거나 지울 수 없도록 행 단위 보안 규칙이 걸려 있다.
- [ ] 로비의 배치와 디자인은 바뀌지 않았다 (문구 정리만 허용).

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

- `src/features/account/model/`
- `src/features/account/viewmodel/`
- `src/features/account/view/`
- `src/features/legal/` (개인정보 처리방침)
- `supabase/migrations/`
- `tests/account.test.mjs`

---

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
