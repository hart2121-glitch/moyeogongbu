# 내 방 물건 원본 (PixelLab create_map_object, 2026-11-02)

사용자 결정(2026-11-02): 완성된 방 그림에서 물건을 떼어 내지 않고, 물건 없는 빈 방(`../../src/empty.png`) 위에 물건마다 따로 만든 그림을 올린다.
모두 low top-down(벽 물건은 side), high detail, selective outline, detailed shading으로 만들었다. `tools/art/home-decor.mjs`가 읽어
투명 둘레를 자르고(협탁은 바닥 그림자 줄을 지우고) 방에 놓는다.

| 파일 | PixelLab id | 설명 |
|---|---|---|
| desk.png | e7c5b690-ccfa-4de3-b064-2e3fe22aa360 | 책장 달린 나무 책상 (빈 방 배경 맞춤) |
| armchair.png | 78f5cb99-8b56-4592-b16e-c801ff1f64d9 | 크림 안락의자, 분홍 쿠션 |
| nightstand.png | 03c06385-5142-4229-bd5c-5c95fa830bcd | 나무 협탁, 서랍 둘 |
| bed.png | 0eb1439d-b199-4bb3-9451-7aa146e82c54 | 나무 침대, 무늬 없는 베개, 세이지 이불 |
| plant.png | 3b63934a-10c3-4862-acf4-c3080ceff14e | 큰 잎 바닥 화분 |
| lamp.png | 6c7ea56f-66a9-4e81-afd9-a6204a1f66cd | 크림 갓 탁상 스탠드 |
| frames.png | 1063b6cf-f16d-45eb-b9bc-51fc474469d2 | 나무 액자 둘 (풍경, 고양이) |
| shelves.png | 10bbb7ce-e14c-4e4a-a342-66a5656d351a | 벽 선반 둘, 작은 화분과 책 |
| cat.png | c55d6bdb-89c7-4460-aebc-0d9aae3b2b63 | 흰 고양이 인형 |
| succulent.png | 0423d5f2-105a-4ad7-99df-4cfea8a5f96a | 작은 다육 화분 (협탁 위 기본, 휴게실 탁자 위 기본) |
| clock.png | bdedcba4-c43a-4899-9561-7ef03ee220d1 | 알람시계와 책 |
| vase.png | bb7eb3ba-d618-44b0-9e4d-65e88c492291 | 튤립 꽃병 |
| book.png | 8d6e62b4-86dd-4cc6-9622-4dbd0d148aa0 | 펼친 책 |
| notebook.png | 68ed5291-cb57-4ae5-b651-c667c1108cc3 | 남색 공책 |
| paper.png | 5a9b03dd-3810-4583-bd47-1bc7f442213d | 얇게 깔린 종이 (책상 위 기본) |
| cushions.png | 79a25d49-cf39-405b-91ee-0a86922c0f19 | 고양이 얼굴 쿠션 둘 (휴게실 소파 기본) |

`cushions.png`는 원본 그대로 두고, `tools/art/company-decor.mjs`가 읽을 때 코와 입을 손으로 다시 찍는다 (2026-11-11 사용자 지적: 회색 타원 코가 돼지 같다. 분홍 코와 ω 입으로 바꿈).
