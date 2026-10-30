# 아트 원본 (Story 009)

규칙은 `AGENTS.md`에 있다: 방 672×432, 캐릭터 칸 56×72, 1배 표시, 안쪽 반투명 픽셀 금지.
`node tools/art/validate.mjs`(또는 `node --test tests/pixel-art.test.mjs`)가 `characters/`와 `rooms/`의 정식 시트를 검사한다.
이름이 `preview`나 `draft`로 시작하는 파일은 검사하지 않는다.

- `characters/`: 게임에 쓰는 레이어 시트 (23칸, 1288×72). `node tools/art/build-character.mjs`가
  `characters/src/`의 원재료로 만들고, 같은 파일을 `public/assets/characters/layers/`에 복사해 쓴다.
  원재료와 칸 순서는 `characters/src/README.md`.
- `characters/draft-*.png`, `characters/sheet-n1.png`: 사용자가 고른 N1 시안까지의 정면 시안.
- `lobby/`: 로비 물건 틀 (`tools/art/lobby-props.mjs`).
- `archive/pilot-24x32/`: 2026-10-30에 접은 24×32 고정 32색 시범. 기록으로만 둔다.
