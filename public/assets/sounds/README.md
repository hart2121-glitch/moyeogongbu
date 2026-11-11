# 방 소리

| 파일 | 원본 | 라이선스 | 만든 방법 |
|---|---|---|---|
| `cafe-loop.mp3` | [File:Cafe ambiance.ogg](https://commons.wikimedia.org/wiki/File:Cafe_ambiance.ogg), Marble Toast, Wikimedia Commons (20분, 원본 SHA-256 `6360791fdcee1f64638f0fc9abd6d2c7a1aa75fd3d2b80033170a02d025099dc`) | CC0 1.0 (퍼블릭 도메인 헌정) | `tools/audio/cafe_loop.py`: 8분 18초부터 63초를 골라 뒤 3초를 앞과 겹친 60초 고리, RMS -23 dBFS, MP3 스테레오 |

빗소리와 키보드 소리는 파일 없이 브라우저에서 합성한다 (`src/features/ambience/model/ambienceEngine.ts`).
