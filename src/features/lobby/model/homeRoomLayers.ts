// tools/art/home-room.mjs가 만든 파일이다. 손으로 고치지 말고 도구를 다시 돌린다.
/**
 * 로비 "내 방" 그림 (256×152, 화면 배율 scale). 빈 방(base) 위에 부품(layers)을 배열 순서대로 얹는다.
 * 부품 자리 x, y와 크기는 1배 도트 px이고, 부품마다 나중에 다른 아이템으로 갈아 끼우는 자리다.
 */
export const HOME_ROOM = {
  "size": {
    "width": 256,
    "height": 152
  },
  "scale": 3,
  "base": "/assets/home/room/room-base.png",
  "layers": [
    {
      "id": "rug",
      "name": "러그",
      "x": 56,
      "y": 122,
      "width": 107,
      "height": 30,
      "src": "/assets/home/room/rug.png"
    },
    {
      "id": "frames-right",
      "name": "오른쪽 벽 액자",
      "x": 228,
      "y": 17,
      "width": 26,
      "height": 56,
      "src": "/assets/home/room/frames-right.png"
    },
    {
      "id": "frames-left",
      "name": "왼쪽 벽 액자",
      "x": 2,
      "y": 19,
      "width": 67,
      "height": 30,
      "src": "/assets/home/room/frames-left.png"
    },
    {
      "id": "wall-shelves",
      "name": "벽 선반",
      "x": 182,
      "y": 15,
      "width": 36,
      "height": 46,
      "src": "/assets/home/room/wall-shelves.png"
    },
    {
      "id": "curtains",
      "name": "커튼",
      "x": 82,
      "y": 4,
      "width": 95,
      "height": 84,
      "src": "/assets/home/room/curtains.png"
    },
    {
      "id": "desk",
      "name": "책상",
      "x": 4,
      "y": 45,
      "width": 73,
      "height": 103,
      "src": "/assets/home/room/desk.png"
    },
    {
      "id": "desk-paper",
      "name": "책상 위 종이",
      "x": 35,
      "y": 86,
      "width": 29,
      "height": 13,
      "src": "/assets/home/room/desk-paper.png"
    },
    {
      "id": "desk-lamp",
      "name": "책상 스탠드",
      "x": 43,
      "y": 57,
      "width": 21,
      "height": 31,
      "src": "/assets/home/room/desk-lamp.png"
    },
    {
      "id": "nightstand-left",
      "name": "왼쪽 협탁",
      "x": 134,
      "y": 97,
      "width": 30,
      "height": 26,
      "src": "/assets/home/room/nightstand-left.png"
    },
    {
      "id": "nightstand-jar",
      "name": "협탁 소품",
      "x": 137,
      "y": 85,
      "width": 9,
      "height": 12,
      "src": "/assets/home/room/nightstand-jar.png"
    },
    {
      "id": "nightstand-plant",
      "name": "협탁 화분",
      "x": 143,
      "y": 69,
      "width": 22,
      "height": 28,
      "src": "/assets/home/room/nightstand-plant.png"
    },
    {
      "id": "bed",
      "name": "침대 틀",
      "x": 163,
      "y": 61,
      "width": 69,
      "height": 91,
      "src": "/assets/home/room/bed.png"
    },
    {
      "id": "bed-cat",
      "name": "침대 고양이",
      "x": 191,
      "y": 79,
      "width": 15,
      "height": 9,
      "src": "/assets/home/room/bed-cat.png"
    },
    {
      "id": "bed-blanket",
      "name": "이불",
      "x": 163,
      "y": 87,
      "width": 68,
      "height": 58,
      "src": "/assets/home/room/bed-blanket.png"
    },
    {
      "id": "nightstand-right",
      "name": "오른쪽 협탁",
      "x": 218,
      "y": 107,
      "width": 38,
      "height": 45,
      "src": "/assets/home/room/nightstand-right.png"
    },
    {
      "id": "lamp-right",
      "name": "협탁 스탠드",
      "x": 231,
      "y": 87,
      "width": 22,
      "height": 34,
      "src": "/assets/home/room/lamp-right.png"
    },
    {
      "id": "armchair",
      "name": "안락의자",
      "x": 65,
      "y": 72,
      "width": 53,
      "height": 68,
      "src": "/assets/home/room/armchair.png"
    },
    {
      "id": "floor-plant",
      "name": "바닥 화분",
      "x": 0,
      "y": 100,
      "width": 37,
      "height": 52,
      "src": "/assets/home/room/floor-plant.png"
    }
  ]
} as const;
