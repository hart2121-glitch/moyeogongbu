# Story 009 증거: 도트 스프라이트로 다시 그리기

스토리: `production/epics/moyeogongbu/story-009-pixel-art.md` (Visual/Feel). 그림은 모두 `production/qa/evidence/story-009-pixel-art/`에 있고,
`stamp-*.txt`가 그때 바뀐 파일의 해시다. 테스트는 `npm run build`, 실행 중인 개발 서버 대상 `node --test tests/*.test.mjs`.

## 완료 기준별 증거

| 기준 | 증거 |
|---|---|
| 그림체 확정 (앞모습 시안) | `art-src/characters/draft-front-n1.png` (2026-10-30 사용자 확정) |
| 자동 검사 (반투명, 크기, 발 기준점) | `tests/pixel-art.test.mjs` 12개 통과, `node tools/art/validate.mjs` 정식 그림 230장 0개 실패 |
| 시트 23칸, 같은 발 기준점 | 위 검사, `boy-frames.png`, `girl-uniform.png`, `north-lowered.png` |
| 산 아이템이 실제 그림으로 | `customize-all-items.png`, `customize-hair-styles.png`, `accessories.png`, `new-outfits.png`, Story 007 `room-comember-customized.png` |
| 서기, 걷기, 위아래 좌석, 소파 휴식 | `room-walking.png`, `fix-arms-room-walk.png`, `poses-seat-up-down-sofa.png`, `room-seated.png` |
| 정수 배율, 흐림 없음 | `company-room-1x.png` (1배), `home-lobby-decorated.png` (3배), `entrance-login-1440.png` (3배), `entrance-welcome-390.png` (2배) |
| 회사 방 새 그림과 좌표 | `company-room-1440.png`, `company-room-seated.png`, 테스트 `movement-browser`, `seat-sides-browser` |
| 원본 보존 | `public/assets/company-study-room-final.png`는 커밋 419129a 뒤로 바뀌지 않음 |

## 함께 만든 꾸미기 슬롯 (사용자 결정으로 범위에 더함)

| 내용 | 증거 |
|---|---|
| 내 책상 세트 (회사 방 책상) | `desk-customize.png`, `desk-room.png`, 테스트 `desk-set` |
| 회사 방 공용 꾸밈 (방장) | `room-decor-owner-tools.png`, `room-decor-member.png`, 테스트 `room-decor` |
| 내 방 꾸밈 (로비) | `home-customize-try.png`, `home-lobby-decorated.png`, 테스트 `home-decor` |

## 운영 확인 뒤 고친 것 (2026-11-01)

- 걷기 손 겹침과 그 정리로 생긴 팔 외곽선 지움: `fix-walk-hands-before-after.png`, `fix-arms-outline-before-after.png`
- 리본 머리카락, 별 머리핀, 남자 교복 허리: `fix-ribbon-hairpin-boywaist.png`
- 머그 손잡이: `fix-mug-one-handle.png`

## 꾸밈 아이템 다시 만들기 (2026-11-02, 사용자 지적)

사용자 지적: 책상 색을 바꿔도 책상 위 물건 둘레에 옛 책상 색이 남았다 (아이템 그림에 아래 가구 칸이 섞임). 하늘색 벽지처럼 혼자 튀는 아이템,
꾸미기 화면의 쓸데없는 안내 문장, 좁은 탭의 줄바꿈도 함께 고쳤다. 스탬프 `stamp-decor-themes-2026-11-02.txt`.

| 내용 | 증거 |
|---|---|
| 내 방을 물건별로 다시 떼기 (같은 날 저녁 따로 만든 물건으로 바꿈, 아래) | 테스트 `home-art` (첫 구현 그림에서는 책상과 같은 색 칸 18칸으로 실패) |
| 테마 넷 (브라운, 화이트, 블랙, 앤티크)과 섞은 조합, 데코타일, 대리석, 파케이 | `home-themes.png`, `home-themes-mixed.png` |
| 꾸미기 내 방 탭의 테마 한 번에 놓기 | `home-theme-antique.png`, 테스트 `home-decor` |
| 로비 내 방 (흰 벽지, 흰 안락의자, 책) | `home-lobby-decorated.png` |
| 휴게실 테마 러그, 물건 칸만 뗀 기본 쿠션, 탁자 위, 매트 | `room-decor-themed-rugs.png`, `room-decor-member.png`, `room-decor-owner-tools.png`, 테스트 `room-decor` |
| 안내 문장 지우기, 탭 한 줄 | Story 007 증거 `customize-try-on.png` |

## 피드백 반영 (2026-11-02 저녁)

| 내용 | 증거 |
|---|---|
| 내 방을 빈 방 위에 따로 만든 물건(PixelLab)으로 다시 조립, 테마와 섞은 조합 | `home-themes.png`, `home-themes-mixed.png`, `home-lobby-decorated.png`, `home-theme-antique.png`, 테스트 `home-art`, `home-decor` |
| 휴게실 기본 소품도 따로 만든 그림 (고양이 쿠션, 다육 화분과 고양이 인형, 고양이 얼굴 매트), 러그 위쪽 줄까지 덮기 | `room-decor-themed-rugs.png`, `room-decor-member.png`, `room-decor-owner-tools.png` |
| 세이지, 로즈 옷을 교복 색 바꾸기에서 새 옷(멜빵 원피스, 동그란 깃 원피스)으로 | `outfits-sage-rose.png` (교복, 세이지, 로즈 순) |
| 벽시계 바늘이 실제 시각 | `room-wall-clock.png`, 테스트 `app` |
| 소파 휴식이 소파 위에 앉는다 | `room-sofa-rest.png`, 테스트 `company-room` |
| 왼쪽 메뉴 "내 방" 따로, 할 일 바로 쓰기와 취소선 | `lobby-menu-todos.png`, 테스트 `app`, `records-browser` |

## 회사 방이 화면을 채운다 (2026-11-02, 사용자 결정)

남는 화면에 방 전체가 들어가는 배율로 그린다. 2배 이상이면 정수(선명), 그보다 좁으면 1~2배 사이 배율 그대로 (`roomScale`, AGENTS.md 예외).
할 일, 반응, 지금 하는 일은 방 오른쪽 열로 옮겼다.

| 화면 | 증거 |
|---|---|
| 1920×1080: 정확히 2배 (1344×864) | `room-fill-1920x1080.png` |
| 1440×900: 약 1.48배 (993×638) | `room-fill-1440x900.png`, 테스트 `movement-browser`(캐릭터 폭 = 56 × 방 배율), `seat-sides-browser` |

## 앉기 동작 (2026-11-11)

소파에서 서 있는 것처럼 보이던 휴식 자세를 PixelLab으로 만든 앉기(무릎을 굽힌 정면)로 바꾸고, 앉을 때 사이 칸 두 개를
한 번 지나가게 했다 (의자 23, 24 → 21, 소파 25, 26 → 22). 시트는 27칸이 되었고 기존 22칸은 바뀌지 않았다.
소파 앉는 자리는 발이 소파 앞으로 나오도록 캐릭터 4픽셀 아래로 옮겼다 (회사 방 y 402, 카페 seatY 344).
앞줄에 앉은 사람의 머리 위에 뒷줄 좌석 번호 글자가 뜨던 것을 숨겼고, 휴게실 고양이 쿠션의 회색 타원 코를 분홍 코와 ω 입으로 고쳤다.

| 화면 | 증거 |
|---|---|
| 회사 방 소파 휴식 | `sit-company-sofa.png` |
| 카페 소파 휴식 (정장) | `sit-cafe-sofa-suit.png` |
| 4번 착석, 1번 번호 글자 숨김 | `sit-seat-4-covers-seat-1-number.png`, 테스트 `seat-markers` |
| 옷 7벌의 앉는 칸 (서기, 의자 사이 23, 24, 의자 21, 소파 사이 25, 26, 소파 22) | `sit-frames-all-outfits.png`, 테스트 `sprites` |
| 휴게실 고양이 쿠션 | `lounge-cat-cushions.png` |

## 제자리 동작 (2026-11-12)

서 있을 때 숨쉬기와 책상 앞에서 공부하는 동작을 더했다. 새 칸은 기존 칸에서 줄을 옮겨 만들어 228장 레이어가 그대로 맞는다.
시트는 33칸이 되었고 기존 27칸은 바뀌지 않았다.

- 서서 숨쉬기 27~30(아래, 위, 왼, 오): 다리 위 윗몸이 1픽셀 올라간다. 서기 칸과 0.7초마다 오간다.
- 책상 앞 31(숨쉬기, 1픽셀 올라감), 32(끄덕임, 목 아래로 머리 1픽셀 숙임): 21, 31, 21, 31, 21, 32 순서로 0.7초마다 돈다.
- 로비 내 캐릭터와 꾸미기 큰 미리보기도 숨쉰다. 움직임 줄이기 설정이면 제자리 동작은 멈추고 걷기만 움직인다.

| 화면 | 증거 |
|---|---|
| 책상 앞 반복 (21, 31, 32) | `idle-desk-loop-21-31-32.png`, 테스트 `sprites` |
| 로비와 방의 숨쉬기 (0, 27) | `idle-breathe-lobby-room.png` |
| 옷 3벌의 서기와 숨쉬기 4방향, 책상 앞 3칸 | `idle-frames-all-directions.png` |

## 알려진 한계

- 긴소매 옷(후드티, 가디건, 정장)의 옆모습 팔은 옷 그림의 팔을 그대로 쓴다 (팔 흔들림이 몸 그림보다 작다).
- 학교 방은 브리프대로 첫 출시 이후다.

## 승인

- 리드 승인: 사용자 확인 대기
