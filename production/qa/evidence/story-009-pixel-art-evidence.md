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

## 알려진 한계

- 긴소매 옷(후드티, 가디건, 정장)의 옆모습 팔은 옷 그림의 팔을 그대로 쓴다 (팔 흔들림이 몸 그림보다 작다).
- 학교 방은 브리프대로 첫 출시 이후다.

## 승인

- 리드 승인: 사용자 확인 대기
