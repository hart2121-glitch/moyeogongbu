# 캐릭터 부품 원재료 (Story 009)

`node tools/art/build-character.mjs`가 이 폴더를 읽어 `art-src/characters/`에 23프레임 시트를 만든다.

- `base/rot/{south,north,west}.png`: 기본 몸 서기 (56×72, 머리카락 없음, 회색 바디슈트). 동쪽은 서쪽 반전.
- `base/walk/<방향>/{0..3}.png`: 기본 몸 걷기 (PixelLab skeleton-v3, walking-4-frames, 112×112). 없는 방향은 서기 그림으로 임시 대체한다.
- `hair/<id>/rot/<방향>.png`: "기본 몸 + 그 머리카락"만 생성한 서기. 머리카락은 방향당 1장으로 모든 프레임에 붙인다.
- `outfit/<id>/rot/<방향>.png`, `outfit/<id>/walk/<방향>/{0..3}.png`: "기본 몸 + 그 옷"의 서기와 같은 뼈대의 걷기.

PixelLab 캐릭터 그룹: moyeo-base-n1 (기본 몸 상태 id 2229b235-319f-4c79-82b7-fd05170f581e).
`outfit/uniform`은 임시로 완성 캐릭터 N1(교복, 머리카락, 리본)에서 옷만 떼어 낸다.
