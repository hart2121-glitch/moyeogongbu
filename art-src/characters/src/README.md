# 캐릭터 부품 원재료 (Story 009)

`node tools/art/build-character.mjs`가 이 폴더를 읽어 `art-src/characters/`에 23프레임 시트를 만든다.

- `base/rot/{south,north,west}.png`: 기본 몸 서기 (56×72, 머리카락 없음, 회색 바디슈트). 동쪽은 서쪽 반전.
- `base/walk/<방향>/{0..3}.png`: 기본 몸 걷기 (PixelLab skeleton-v3, walking-4-frames, 112×112). 없는 방향은 서기 그림으로 임시 대체한다.
- `face/<id>/rot/{south,west}.png`: "기본 몸 + 그 얼굴" 서기. 기본 몸 눈과 입 자리의 눈과 입 색만 떼어 낸다 (뒷모습은 없음). 기본 몸 시트는 눈과 입을 지운 맨 얼굴이다. `face/basic`은 승인 시안 N1(`outfit/uniform/rot`와 같은 그림)이다.
- `hair/<모양>/rot/<방향>.png`: "기본 몸 + 그 머리카락"만 생성한 서기. 머리카락은 방향당 1장으로 모든 프레임에 붙인다. **라벤더색으로 생성한다**: 머리 색은 라벤더 색 띠를 바꿔 입히기 때문이다. 출력은 모양마다 모든 색의 `hair-<모양>-<색>-front.png`, `-back.png`다.
- `outfit/<id>/rot/<방향>.png`, `outfit/<id>/walk/<방향>/{0..3}.png`: "기본 몸 + 그 옷"의 서기와 같은 뼈대의 걷기.
- `recolor/hair-color/<색>.json`: 머리 색. 라벤더 색 띠(`hue`)를 명도 순서대로 새 색 띠(`ramp`)로 바꾼다. 모든 머리 모양에 입힌다 (라벤더는 원재료 그대로).
- `recolor/<시트 이름>.json`: 그 밖의 색 바꾸기 변형. 이미 만든 시트(`from`)의 한 색 띠만 바꾼다 (예: 눈 색 = 기본 얼굴의 눈동자 색 바꾸기).

PixelLab 캐릭터 그룹: moyeo-base-n1 (기본 몸 상태 id 2229b235-319f-4c79-82b7-fd05170f581e).
`outfit/uniform`은 임시로 완성 캐릭터 N1(교복, 머리카락, 리본)에서 옷만 떼어 낸다.
