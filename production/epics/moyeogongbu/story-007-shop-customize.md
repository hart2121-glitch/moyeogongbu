# Story 007: 상점과 캐릭터 꾸미기

> **Epic**: moyeogongbu
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-10-30

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 7

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none (React 19 + Vite 웹 앱) | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

- [x] 상점에서 아이템을 코인으로 살 수 있다. 구매는 서버가 처리해 코인 차감과 중복 구매 방지가 어긋나지 않는다.
- [x] 상점은 캐릭터 아이템만 판다: 액세서리 6개, 의상 4개, 머리 4개. 가격은 설정 파일에서 정한다 (액세서리 120~300, 의상과 머리 600~1500). 책상 소품과 공용 가구는 방 꾸미기 슬롯이 생길 때 올린다.
- [x] 가입하면 기본 몸, 얼굴, 머리 2종, 의상 2종을 무료로 받고, 처음 꾸미기에서 고른다.
- [x] 가입하면 환영 선물 120코인이 우편으로 온다. 데모의 1250코인 초기값은 없앤다.
- [x] 캐릭터는 몸, 얼굴, 뒷머리, 앞머리, 의상, 액세서리 레이어로 합성되어 보인다.
- [x] 꾸미기 화면에서 산 아이템을 적용할 수 있고, 사지 않은 아이템도 입어 볼 수 있다 (저장되지 않음). 산 아이템은 되팔거나 환불할 수 없다.
- [x] 적용한 꾸밈은 저장되어 새로고침 후에도 같은 모습이다.
- [x] 같은 방 친구에게 내 꾸민 캐릭터가 보인다.
- [x] 코인이 부족하면 구매 버튼이 막히고 이유가 부드러운 문구로 안내된다.
- [x] 새 픽셀아트 캐릭터가 준비되기 전에는 지금 이미지로 동작하고, 에셋만 바꿔 끼울 수 있다.
- [x] 상점과 꾸미기는 로비를 처음 열 때 보이지 않는 현재 동작을 유지한다.
- [x] 계정을 삭제하면 그 사람의 보유 아이템과 꾸밈 설정이 모두 지워진다.

---

## Implementation Notes

- 기존 `src/character-preview/`의 레이어 구조(`model.js`, `LayerStack.jsx`)를 게임 안으로 옮겨 쓴다.
- 레이어마다 프레임 구성이 같아야 아이템이 모든 동작에서 맞는다.
- 공용 가구와 책상 꾸미기(슬롯)는 새 픽셀아트 방이 나온 뒤의 일이라 이 스토리에 넣지 않는다.

---

## Out of Scope

- 방 꾸미기 슬롯과 공용 가구
- 새 픽셀아트 에셋 제작

---

## Files

- `src/config/shop.ts`
- `src/features/character/model/character.ts`
- `src/features/character/model/layers.ts`
- `src/features/character/model/look.ts`
- `src/features/character/view/CharacterPage.tsx`
- `src/features/character/view/LayerStack.tsx`
- `src/features/character/viewmodel/useCharacter.ts`
- `src/features/lobby/view/LobbyPage.tsx`
- `src/features/mailbox/model/mail.ts`
- `src/features/room/model/room.ts`
- `src/features/room/view/RemoteCharacter.tsx`
- `src/features/rooms/view/CompanyRoomPage.tsx`
- `src/features/shell/viewmodel/AppStateContext.ts`
- `src/features/shell/viewmodel/AppStateProvider.tsx`
- `src/features/shop/model/shop.ts`
- `src/features/shop/model/shopStore.ts`
- `src/features/shop/view/ShopPage.tsx`
- `src/features/shop/viewmodel/useShop.ts`
- `src/study/CharacterSprite.jsx`
- `src/study/CompanyRoom.jsx`
- `src/styles.css`
- `supabase/migrations/20261030130000_shop.sql`
- `tests/app.test.mjs`
- `tests/shop.test.mjs`
- `tests/supabaseMock.mjs`

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: UI
**Required evidence**: 상점과 캐릭터 꾸미기 화면의 retained screenshot을 `production/qa/evidence/`에 남긴다.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/moyeogongbu/story-003-coin-settlement.md`, `production/epics/moyeogongbu/story-006-friends-mail.md` (환영 선물 우편)
- Unlocks: None

## Completion Notes
**Completed**: 2026-10-30
**Criteria**: 12/12 passing (none deferred). 환영 선물 한 번 지급, 구매 차감과 중복 방지, 잔액 부족 거절, 동시 구매, 보유 아이템만 저장, 같은 방 멤버만 꾸밈 조회, 계정 삭제를 로컬 Postgres SQL로 점검했다.
**Deviations**: ADVISORY, 아이템별 픽셀아트가 아직 없어 `src/config/shop.ts`의 모든 항목이 임시 연결이다(의상은 기존 색상 변형, 머리와 얼굴과 액세서리는 데이터만 바뀌고 그림은 같음). 새 아트는 이 표만 바꾸면 끼워진다. 로비 아바타는 로비 디자인 유지를 위해 레이어 합성이 아닌 기존 한 장 이미지에 의상 색만 입힌다. 구매는 같은 사용자의 동시 구매만 잠그므로, 구매 중에 할 일 완료를 취소하면 드물게 잔액이 조금 음수가 될 수 있다.
**Test Evidence**: `production/qa/evidence/story-007-shop-customize/`, `tests/shop.test.mjs`, 전체 56/56 두 번 통과.
**Reviewed by**: self, no independent review
