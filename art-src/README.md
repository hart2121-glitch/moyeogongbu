# 아트 원본 (Story 009)

규칙은 `AGENTS.md`에 있다: 방 672×432, 캐릭터 칸 56×72, 1배 표시, 안쪽 반투명 픽셀 금지.
`node tools/art/validate.mjs`(또는 `node --test tests/pixel-art.test.mjs`)가 `characters/`와 `rooms/`의 정식 시트를 검사한다.
이름이 `preview`나 `draft`로 시작하는 파일은 검사하지 않는다.

- `characters/`: 게임에 쓰는 레이어 시트 (23칸, 1288×72). `node tools/art/build-character.mjs`가
  `characters/src/`의 원재료로 만들고, 같은 파일을 `public/assets/characters/layers/`에 복사해 쓴다.
  원재료와 칸 순서는 `characters/src/README.md`.
- `characters/draft-*.png`, `characters/sheet-n1.png`: 사용자가 고른 N1 시안까지의 정면 시안.
- `lobby/`: 로비 물건 틀 (`tools/art/lobby-props.mjs`).
- `home/room/`: 로비 "내 방" 256×152 (화면 3배). `node tools/art/home-room.mjs`가 `home/room/src/`의 생성 원본(가구가 있는 방과
  빈 방, 영역표)에서 부품을 떼어 내고 손 보정(베개 무늬 지우기, 고양이 다시 찍기)한 뒤 같은 파일을 `public/assets/home/room/`에 쓴다.
- `rooms/company-room.png`: 회사 스터디룸 672×432 (화면 1배). `node tools/art/company-room.mjs --prep`가 회사 원본 화면용 사본의 방 영역에서 글자를 지운
  두 조각을 만들고, PixelLab image_to_pixelart(faithful, 보존 200)로 바꾼 `rooms/src/converted-left.png`, `converted-right.png`를
  `node tools/art/company-room.mjs`가 최소 오차 이음매로 잇고 좌석 동그라미를 다시 찍어 `public/assets/rooms/`에 쓴다.
  휴게실 공용 꾸밈 자리(쿠션, 탁자 위, 매트)는 `rooms/src/lounge-empty.png`로 비우고, 원본 소품은 기본 아이템 `rooms/lounge/cushions-cat.png`,
  `table-cat.png`, `mat-cat.png`로 떼어 둔다. 파는 아이템은 `node tools/art/company-decor.mjs`가 `rooms/lounge/`에 그린다
  (탁자 위 PixelLab 시안은 `rooms/lounge/src/`, 미리보기 `rooms/lounge/preview-decor.png`).
- `home/room/decor/`: 내 방 꾸밈 층과 아이템. `node tools/art/home-decor.mjs`가 `home/room/`의 부품을 자리별 층으로 다시 나누고
  (벽 불빛, 러그, 마루, 이불 조각을 제 자리로), 색과 칠을 바꾼 판매 아이템, 직접 찍은 협탁 위 소품을 같은 폴더와 `public/assets/home/room/decor/`에 쓴다.
  미리보기는 `home/room/decor/preview-check.png`, `preview-more.png`. `decor/src/`의 PixelLab 협탁 위 시안은 쓰지 않았다(기록용).
- `home/entrance/`: 로그인과 환영 화면의 집 현관 240×144 (넓은 화면 3배, 좁은 화면 2배). `node tools/art/home-entrance.mjs`가
  `home/entrance/src/`의 생성 원본(pixen 시안 2번을 pixflux로 다시 그린 그림)을 손 보정(벽등 빛을 타원으로, 문패 자리에 벽지 채우기)하고,
  이름 길이에 맞춰 늘어나는 문패 9조각 `sign.png`(9×16)를 그려 같은 파일을 `public/assets/home/entrance/`에 쓴다.
- `archive/pilot-24x32/`: 2026-10-30에 접은 24×32 고정 32색 시범. 기록으로만 둔다.
