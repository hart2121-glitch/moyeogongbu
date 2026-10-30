# Story 009: 도트 스프라이트로 다시 그리기

> **Epic**: moyeogongbu
> **Status**: Ready
> **Layer**: Presentation
> **Type**: Visual/Feel
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-10-30

*아트 제작은 사람(사용자 또는 외주)이 하고, 개발은 검사 도구와 연결을 맡는다. 생성 이미지나 자동 변환 결과를 손 보정 없이 쓰지 않는다 (`AGENTS.md`).*

## Context

**GDD**: `design/game-brief.md` (## 아트, ## 꾸미기와 상점)
**Requirement**: Brief 아트 기준, Story 007의 임시 아이템 연결 해소

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none (React 19 + Vite 웹 앱) | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## 공통 규칙

2026-10-30 결정: 24×32, 고정 32색 시범(`art-src/archive/pilot-24x32/`)은 얼굴이 보이지 않아 사용자가 반려했다. 기준을 메이플스토리 수준의 도트 스프라이트로 바꿨다.

- 색 수 제한 없음. 회사 원본(`public/assets/company-study-room-final.png`)과 지금 캐릭터의 색감을 따른다.
- 반투명 픽셀은 실루엣 가장자리(완전 투명 픽셀과 맞닿은 곳)에만 쓰고, 안쪽은 불투명.
- 원본 크기로 그리고, 방과 캐릭터 모두 화면에 1배로 그린다 (확대가 필요하면 정수 배율만).
- 파일은 투명 PNG. 원본 그림은 `art-src/`에, 화면용은 `public/`에 둔다.

## 1차 목표 (2026-10-30 사용자 결정)

- 기본 캐릭터 위에 바꿔 끼울 수 있는 **헤어스타일 5종 이상**과 **의상 3종**을 만들고, 모든 동작(서기 4방향, 걷기 4방향 각 4프레임, 의자 앉기 2종, 소파 휴식)에서 동작하게 한다.
- 제작 방식: 기본 몸(머리카락 없음, 회색 바디슈트)을 먼저 만들고, 부품마다 "기본 몸 + 그 부품"만 생성해 차이로 떼어 낸다. 걷기는 PixelLab skeleton-v3(같은 뼈대 동작)로 만들어 기본 몸과 부품 버전의 자세를 맞춘다.
- 머리카락과 머리 장식은 방향당 1장을 프레임별 머리 위치에 붙인다. 목 아래로 내려온 머리카락은 몸 뒤(뒷머리), 목 위는 몸 앞(앞머리)에 그린다. 의상은 걷기 프레임마다 떼어 낸다.
- 동쪽은 서쪽을 좌우 반전해 만든다.

## 만들 그림 목록

### 1. 앞모습 시안 (가장 먼저)
- 기본 캐릭터 서기 앞모습 한 장(56×72)으로 그림체를 확정한다. 확정 전에는 다른 그림을 그리지 않는다.

### 2. 캐릭터 레이어 (56×72, 레이어마다 같은 프레임 구성)
레이어 순서: 뒷머리, 몸, 의상, 얼굴, 앞머리, 액세서리. 모든 레이어가 아래 23프레임을 같은 순서로 가진 한 장의 시트로 그린다 (가로 23칸 × 56px = 1288×72).

| 칸 | 동작 |
|---|---|
| 1~4 | 서기: 아래, 위, 왼쪽, 오른쪽 |
| 5~8 | 아래로 걷기 4프레임 |
| 9~12 | 위로 걷기 4프레임 |
| 13~16 | 왼쪽 걷기 4프레임 |
| 17~20 | 오른쪽 걷기 4프레임 (왼쪽 반전으로 대신할지는 그릴 때 정한다) |
| 21 | 의자 앉기 (위쪽 좌석, 등이 보임) |
| 22 | 의자 앉기 (아래쪽 좌석, 얼굴이 보임) |
| 23 | 소파 휴식 |

발 기준점은 모든 프레임에서 아래 가운데로 같게 둔다.

필요한 시트 (아이템 id는 `shop_items` 기준):

- 기본 (무료)
  - 몸: `body-basic`
  - 얼굴: `face-basic` (보라 눈), 눈 색 6종 (2026-10-31 추가, 눈동자 색만 바꿈): `face-black`, `face-brown`, `face-amber`, `face-green`, `face-blue`, `face-gray`
  - 머리 모양: `hair-basic` (단순한 모양, 생성 전까지 머리카락 없음)
  - 머리 색 2종: `hair-color-lavender`, `hair-color-chestnut`
  - 의상 2종: `outfit-lavender`, `outfit-sage`
- 상점 액세서리 6종: `acc-ribbon`, `acc-hairpin`, `acc-glasses`, `acc-headphones`, `acc-scarf`, `acc-beret`
- 상점 의상 4종: `outfit-rose`, `outfit-hoodie`, `outfit-cardigan`, `outfit-suit`
- 상점 머리 모양 4종: `hair-ponytail`, `hair-short`, `hair-wave` (N1의 긴 웨이브 머리), `hair-long` (각각 뒷머리, 앞머리)
- 상점 머리 색 8종 (2026-10-31 추가, 300코인, 모든 머리 모양에 쓴다): `hair-color-black`, `hair-color-gray`, `hair-color-ashgray`, `hair-color-white`, `hair-color-blonde`, `hair-color-red`, `hair-color-pink`, `hair-color-skyblue`
- 머리 시트는 모양마다 10색: `hair-<모양>-<색>-front.png`, `-back.png` (모양은 라벤더로 생성하고 색은 색 띠 바꾸기)

합계 시트 26장 (머리 6종 × 2장 + 몸 1 + 얼굴 1 + 의상 6 + 액세서리 6).

상점 카드에 쓸 아이템 아이콘은 서기(아래) 프레임을 잘라 쓴다. 따로 그리지 않는다.

### 3. 회사 방 (672×432)
- 범위: 원본 `public/assets/company-study-room-final-display.png`의 x 0~1340, y 60~922. 위쪽 제목줄과 오른쪽 타이머, 할 일, 음악 패널(가짜 앱 UI)은 그리지 않는다.
- 화면 좌표 환산과 연결은 로비 세션이 맡는다 (`src/study/companyFinalLayout.js`).
- 구조, 가구 배치, 색감은 회사 원본을 따른다. 배치를 바꿔야 하면 먼저 사용자에게 설명한다.
- 가구와 소품은 16픽셀 격자에 맞춘다.
- 착석 시 하체를 가리는 책상 전경을 별도 레이어로 둔다 (지금 `companyFinalLayout.js`의 전경 영역과 같은 역할).
- 원본을 줄인 밑그림 위에 손 보정한다.

### 4. 학교 방 (672×432)
- 회사 방 다음 순서. 로비 학교 카드의 "준비 중" 표시를 이 그림으로 바꾼다.

### 범위 밖
- 로비 디자인: 2026-10-30 재설계로 로비 장면은 회사 방 그림의 책상 구역을 잘라 쓴다. 새 방이 나오면 로비도 그 그림을 쓴다 (로비 세션 담당).
- 방 꾸미기 슬롯용 책상 소품과 공용 가구.

---

## Acceptance Criteria

- [x] 사용자가 앞모습 시안으로 그림체를 확정한다. (2026-10-30, N1: `art-src/characters/draft-front-n1.png`, 생성 원본 `art-src/drafts/gen-raw-1.png`)
- [ ] 자동 검사가 안쪽 반투명 픽셀, 크기 위반(캐릭터 시트 1288×72, 방 672×432), 발 기준점 어긋남을 테스트에서 막는다.
- [ ] 캐릭터 시트 26장이 같은 23프레임 구성과 같은 발 기준점을 가진다.
- [ ] 상점에서 산 머리, 의상, 액세서리가 로비 아바타, 꾸미기 화면, 방 캐릭터, 같은 방 멤버 화면에 실제 그림으로 보인다. `src/config/shop.ts`의 임시 연결 표시가 모두 사라진다.
- [ ] 4방향 서기와 걷기, 위아래 좌석 앉기, 소파 휴식이 새 프레임으로 재생된다.
- [ ] 회사 방이 새 픽셀아트로 바뀌고, 좌석, 통로, 휴게실, 화장실, 출입구 좌표가 새 그림에 맞는다. 기존 이동과 충돌 테스트가 통과한다.
- [ ] 화면에서 정수 배율로만 확대되고 흐림 없이(pixelated) 보인다.
- [ ] 원본 이미지 파일은 바이트 변경 없이 보존된다.

---

## Implementation Notes

- 개발 쪽 선행 작업: 검사 도구 `tools/art/validate.mjs`와 `tests/pixel-art.test.mjs`(완료). 그림이 하나씩 들어올 때마다 바로 검사한다.
- 시트 한 장을 프레임 23칸으로 자르는 메타데이터 하나를 두고, `characterSprites.js`와 레이어 합성이 그것을 쓴다.
- 그림을 끼우는 작업은 `src/config/shop.ts`의 표 교체와 `characterSprites.js`의 경로 등록이다. 아이템 가격과 판매 목록은 바꾸지 않는다.
- 방 좌표는 상대 좌표라 새 그림이 같은 배치를 따르면 대부분 그대로 쓴다. 새 그림 기준으로 다시 맞추고 기존 브라우저 테스트로 확인한다.

---

## Out of Scope

- 로비 배경과 디자인
- 방 꾸미기 슬롯, 책상 소품, 공용 가구
- 애니메이션 추가 동작 (손 흔들기, 일어서기 전환 등)

---

## Files

- `art-src/` (원본 그림과 팔레트)
- `public/assets/characters/` (화면용 시트)
- `public/assets/rooms/` (화면용 방)
- `src/config/shop.ts`
- `src/study/characterSprites.js`
- `src/study/companyFinalLayout.js`
- `tests/pixel-art.test.mjs`

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: 새 캐릭터(서기, 걷기, 앉기, 휴식)와 아이템 착용, 새 회사 방의 retained screenshot과 `production/qa/evidence/story-009-pixel-art-evidence.md`의 승인 기록.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/moyeogongbu/story-007-shop-customize.md`
- Unlocks: None
