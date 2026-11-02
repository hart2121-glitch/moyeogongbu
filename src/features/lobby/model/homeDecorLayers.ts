// tools/art/home-decor.mjs가 만든 파일이다. 손으로 고치지 말고 도구를 다시 돌린다.
/**
 * 로비 "내 방"을 꾸밈 자리별 층으로 나눈 그림 (꾸미기 슬롯 계획 3절). 바탕(빈 방) 위에 draw 순서로 층을 얹는다.
 * layers는 기본 아이템의 층(1배 좌표), slots는 자리마다 바뀌는 층, items는 판매 아이템이 층마다 쓰는 그림이다
 * (null이면 그 층을 감춘다). wall, floor 층은 기본 그림이 없고 판매 아이템만 바탕 위에 덮는다.
 * fixed 층(불빛, 그림자)은 자리 없이 늘 그리고, blend로 아래 그림과 섞는다 (불빛은 screen, 그림자는 multiply).
 */
export const HOME_DECOR = {
  "size": {
    "width": 256,
    "height": 152
  },
  "scale": 3,
  "base": "/assets/home/room/decor/room-base.png",
  "draw": [
    "wall",
    "floor",
    "glow",
    "rug",
    "shadow",
    "frames-right",
    "frames-left",
    "wall-shelves",
    "curtains",
    "curtain-rod",
    "desk",
    "desk-paper",
    "desk-lamp",
    "nightstand-mid",
    "nightstand-jar",
    "nightstand-plant",
    "bed",
    "bed-cat",
    "bed-blanket",
    "nightstand-right",
    "lamp-right",
    "armchair",
    "floor-plant"
  ],
  "fixed": [
    "glow",
    "shadow"
  ],
  "layers": {
    "glow": {
      "x": 44,
      "y": 75,
      "width": 209,
      "height": 36,
      "src": "/assets/home/room/decor/glow.png",
      "blend": "screen"
    },
    "rug": {
      "x": 51,
      "y": 118,
      "width": 129,
      "height": 34,
      "src": "/assets/home/room/decor/rug.png"
    },
    "shadow": {
      "x": 0,
      "y": 26,
      "width": 252,
      "height": 126,
      "src": "/assets/home/room/decor/shadow.png",
      "blend": "multiply"
    },
    "frames-right": {
      "x": 228,
      "y": 17,
      "width": 25,
      "height": 53,
      "src": "/assets/home/room/decor/frames-right.png"
    },
    "frames-left": {
      "x": 3,
      "y": 19,
      "width": 66,
      "height": 28,
      "src": "/assets/home/room/decor/frames-left.png"
    },
    "wall-shelves": {
      "x": 182,
      "y": 15,
      "width": 35,
      "height": 47,
      "src": "/assets/home/room/decor/wall-shelves.png"
    },
    "curtains": {
      "x": 87,
      "y": 13,
      "width": 93,
      "height": 86,
      "src": "/assets/home/room/decor/curtains.png"
    },
    "curtain-rod": {
      "x": 82,
      "y": 5,
      "width": 95,
      "height": 8,
      "src": "/assets/home/room/decor/curtain-rod.png"
    },
    "desk": {
      "x": 7,
      "y": 49,
      "width": 70,
      "height": 95,
      "src": "/assets/home/room/decor/desk.png"
    },
    "desk-paper": {
      "x": 37,
      "y": 88,
      "width": 23,
      "height": 9,
      "src": "/assets/home/room/decor/desk-paper.png"
    },
    "desk-lamp": {
      "x": 46,
      "y": 58,
      "width": 16,
      "height": 28,
      "src": "/assets/home/room/decor/desk-lamp.png"
    },
    "nightstand-mid": {
      "x": 138,
      "y": 92,
      "width": 29,
      "height": 30,
      "src": "/assets/home/room/decor/nightstand-mid.png"
    },
    "nightstand-jar": {
      "x": 141,
      "y": 88,
      "width": 7,
      "height": 7,
      "src": "/assets/home/room/decor/nightstand-jar.png"
    },
    "nightstand-plant": {
      "x": 145,
      "y": 72,
      "width": 19,
      "height": 24,
      "src": "/assets/home/room/decor/nightstand-plant.png"
    },
    "bed": {
      "x": 164,
      "y": 62,
      "width": 69,
      "height": 90,
      "src": "/assets/home/room/decor/bed.png"
    },
    "bed-cat": {
      "x": 187,
      "y": 97,
      "width": 16,
      "height": 12,
      "src": "/assets/home/room/decor/bed-cat.png"
    },
    "bed-blanket": {
      "x": 164,
      "y": 88,
      "width": 77,
      "height": 56,
      "src": "/assets/home/room/decor/bed-blanket.png"
    },
    "nightstand-right": {
      "x": 225,
      "y": 112,
      "width": 31,
      "height": 40,
      "src": "/assets/home/room/decor/nightstand-right.png"
    },
    "lamp-right": {
      "x": 230,
      "y": 87,
      "width": 21,
      "height": 31,
      "src": "/assets/home/room/decor/lamp-right.png"
    },
    "armchair": {
      "x": 72,
      "y": 74,
      "width": 41,
      "height": 63,
      "src": "/assets/home/room/decor/armchair.png"
    },
    "floor-plant": {
      "x": 1,
      "y": 106,
      "width": 34,
      "height": 45,
      "src": "/assets/home/room/decor/floor-plant.png"
    }
  },
  "slots": {
    "wallpaper": [
      "wall"
    ],
    "floor": [
      "floor"
    ],
    "rug": [
      "rug"
    ],
    "frames": [
      "frames-right",
      "frames-left"
    ],
    "shelves": [
      "wall-shelves"
    ],
    "curtains": [
      "curtains",
      "curtain-rod"
    ],
    "desk": [
      "desk"
    ],
    "desk_top": [
      "desk-paper"
    ],
    "lamps": [
      "desk-lamp",
      "lamp-right"
    ],
    "nightstands": [
      "nightstand-mid",
      "nightstand-right"
    ],
    "nightstand_top": [
      "nightstand-jar",
      "nightstand-plant"
    ],
    "bed": [
      "bed"
    ],
    "plush": [
      "bed-cat"
    ],
    "blanket": [
      "bed-blanket"
    ],
    "armchair": [
      "armchair"
    ],
    "floor_plant": [
      "floor-plant"
    ]
  },
  "items": {
    "home-wall-stripe": {
      "wall": {
        "src": "/assets/home/room/decor/home-wall-stripe-wall.png",
        "x": 0,
        "y": 2,
        "width": 256,
        "height": 139
      }
    },
    "home-wall-white": {
      "wall": {
        "src": "/assets/home/room/decor/home-wall-white-wall.png",
        "x": 0,
        "y": 2,
        "width": 256,
        "height": 139
      }
    },
    "home-wall-charcoal": {
      "wall": {
        "src": "/assets/home/room/decor/home-wall-charcoal-wall.png",
        "x": 0,
        "y": 2,
        "width": 256,
        "height": 139
      }
    },
    "home-wall-damask": {
      "wall": {
        "src": "/assets/home/room/decor/home-wall-damask-wall.png",
        "x": 0,
        "y": 2,
        "width": 256,
        "height": 139
      }
    },
    "home-floor-maple": {
      "floor": {
        "src": "/assets/home/room/decor/home-floor-maple-floor.png",
        "x": 0,
        "y": 115,
        "width": 256,
        "height": 37
      }
    },
    "home-floor-walnut": {
      "floor": {
        "src": "/assets/home/room/decor/home-floor-walnut-floor.png",
        "x": 0,
        "y": 115,
        "width": 256,
        "height": 37
      }
    },
    "home-floor-gray": {
      "floor": {
        "src": "/assets/home/room/decor/home-floor-gray-floor.png",
        "x": 0,
        "y": 115,
        "width": 256,
        "height": 37
      }
    },
    "home-floor-tile-beige": {
      "floor": {
        "src": "/assets/home/room/decor/home-floor-tile-beige-floor.png",
        "x": 0,
        "y": 115,
        "width": 256,
        "height": 37
      }
    },
    "home-floor-tile-gray": {
      "floor": {
        "src": "/assets/home/room/decor/home-floor-tile-gray-floor.png",
        "x": 0,
        "y": 115,
        "width": 256,
        "height": 37
      }
    },
    "home-floor-marble-white": {
      "floor": {
        "src": "/assets/home/room/decor/home-floor-marble-white-floor.png",
        "x": 0,
        "y": 115,
        "width": 256,
        "height": 37
      }
    },
    "home-floor-marble-black": {
      "floor": {
        "src": "/assets/home/room/decor/home-floor-marble-black-floor.png",
        "x": 0,
        "y": 115,
        "width": 256,
        "height": 37
      }
    },
    "home-floor-parquet": {
      "floor": {
        "src": "/assets/home/room/decor/home-floor-parquet-floor.png",
        "x": 0,
        "y": 115,
        "width": 256,
        "height": 37
      }
    },
    "home-rug-camel": {
      "rug": {
        "src": "/assets/home/room/decor/home-rug-camel-rug.png",
        "x": 51,
        "y": 118,
        "width": 129,
        "height": 34
      }
    },
    "home-rug-ivory": {
      "rug": {
        "src": "/assets/home/room/decor/home-rug-ivory-rug.png",
        "x": 51,
        "y": 118,
        "width": 129,
        "height": 34
      }
    },
    "home-rug-charcoal": {
      "rug": {
        "src": "/assets/home/room/decor/home-rug-charcoal-rug.png",
        "x": 51,
        "y": 118,
        "width": 129,
        "height": 34
      }
    },
    "home-rug-persian": {
      "rug": {
        "src": "/assets/home/room/decor/home-rug-persian-rug.png",
        "x": 51,
        "y": 118,
        "width": 129,
        "height": 34
      }
    },
    "home-curtain-linen": {
      "curtains": {
        "src": "/assets/home/room/decor/home-curtain-linen-curtains.png",
        "x": 87,
        "y": 13,
        "width": 93,
        "height": 86
      },
      "curtain-rod": {
        "src": "/assets/home/room/decor/home-curtain-linen-curtain-rod.png",
        "x": 82,
        "y": 5,
        "width": 95,
        "height": 8
      }
    },
    "home-curtain-charcoal": {
      "curtains": {
        "src": "/assets/home/room/decor/home-curtain-charcoal-curtains.png",
        "x": 87,
        "y": 13,
        "width": 93,
        "height": 86
      },
      "curtain-rod": {
        "src": "/assets/home/room/decor/home-curtain-charcoal-curtain-rod.png",
        "x": 82,
        "y": 5,
        "width": 95,
        "height": 8
      }
    },
    "home-curtain-burgundy": {
      "curtains": {
        "src": "/assets/home/room/decor/home-curtain-burgundy-curtains.png",
        "x": 87,
        "y": 13,
        "width": 93,
        "height": 86
      },
      "curtain-rod": {
        "src": "/assets/home/room/decor/home-curtain-burgundy-curtain-rod.png",
        "x": 82,
        "y": 5,
        "width": 95,
        "height": 8
      }
    },
    "home-frames-walnut": {
      "frames-left": {
        "src": "/assets/home/room/decor/home-frames-walnut-frames-left.png",
        "x": 3,
        "y": 19,
        "width": 66,
        "height": 28
      },
      "frames-right": {
        "src": "/assets/home/room/decor/home-frames-walnut-frames-right.png",
        "x": 228,
        "y": 17,
        "width": 25,
        "height": 53
      }
    },
    "home-frames-white": {
      "frames-left": {
        "src": "/assets/home/room/decor/home-frames-white-frames-left.png",
        "x": 3,
        "y": 19,
        "width": 66,
        "height": 28
      },
      "frames-right": {
        "src": "/assets/home/room/decor/home-frames-white-frames-right.png",
        "x": 228,
        "y": 17,
        "width": 25,
        "height": 53
      }
    },
    "home-frames-black": {
      "frames-left": {
        "src": "/assets/home/room/decor/home-frames-black-frames-left.png",
        "x": 3,
        "y": 19,
        "width": 66,
        "height": 28
      },
      "frames-right": {
        "src": "/assets/home/room/decor/home-frames-black-frames-right.png",
        "x": 228,
        "y": 17,
        "width": 25,
        "height": 53
      }
    },
    "home-frames-gold": {
      "frames-left": {
        "src": "/assets/home/room/decor/home-frames-gold-frames-left.png",
        "x": 3,
        "y": 19,
        "width": 66,
        "height": 28
      },
      "frames-right": {
        "src": "/assets/home/room/decor/home-frames-gold-frames-right.png",
        "x": 228,
        "y": 17,
        "width": 25,
        "height": 53
      }
    },
    "home-shelves-walnut": {
      "wall-shelves": {
        "src": "/assets/home/room/decor/home-shelves-walnut-wall-shelves.png",
        "x": 182,
        "y": 15,
        "width": 35,
        "height": 47
      }
    },
    "home-shelves-white": {
      "wall-shelves": {
        "src": "/assets/home/room/decor/home-shelves-white-wall-shelves.png",
        "x": 182,
        "y": 15,
        "width": 35,
        "height": 47
      }
    },
    "home-shelves-black": {
      "wall-shelves": {
        "src": "/assets/home/room/decor/home-shelves-black-wall-shelves.png",
        "x": 182,
        "y": 15,
        "width": 35,
        "height": 47
      }
    },
    "home-desk-walnut": {
      "desk": {
        "src": "/assets/home/room/decor/home-desk-walnut-desk.png",
        "x": 7,
        "y": 49,
        "width": 70,
        "height": 95
      }
    },
    "home-nightstand-walnut": {
      "nightstand-mid": {
        "src": "/assets/home/room/decor/home-nightstand-walnut-nightstand-mid.png",
        "x": 138,
        "y": 92,
        "width": 29,
        "height": 30
      },
      "nightstand-right": {
        "src": "/assets/home/room/decor/home-nightstand-walnut-nightstand-right.png",
        "x": 225,
        "y": 112,
        "width": 31,
        "height": 40
      }
    },
    "home-bed-walnut": {
      "bed": {
        "src": "/assets/home/room/decor/home-bed-walnut-bed.png",
        "x": 164,
        "y": 62,
        "width": 69,
        "height": 90
      }
    },
    "home-desk-white": {
      "desk": {
        "src": "/assets/home/room/decor/home-desk-white-desk.png",
        "x": 7,
        "y": 49,
        "width": 70,
        "height": 95
      }
    },
    "home-nightstand-white": {
      "nightstand-mid": {
        "src": "/assets/home/room/decor/home-nightstand-white-nightstand-mid.png",
        "x": 138,
        "y": 92,
        "width": 29,
        "height": 30
      },
      "nightstand-right": {
        "src": "/assets/home/room/decor/home-nightstand-white-nightstand-right.png",
        "x": 225,
        "y": 112,
        "width": 31,
        "height": 40
      }
    },
    "home-bed-white": {
      "bed": {
        "src": "/assets/home/room/decor/home-bed-white-bed.png",
        "x": 164,
        "y": 62,
        "width": 69,
        "height": 90
      }
    },
    "home-desk-black": {
      "desk": {
        "src": "/assets/home/room/decor/home-desk-black-desk.png",
        "x": 7,
        "y": 49,
        "width": 70,
        "height": 95
      }
    },
    "home-nightstand-black": {
      "nightstand-mid": {
        "src": "/assets/home/room/decor/home-nightstand-black-nightstand-mid.png",
        "x": 138,
        "y": 92,
        "width": 29,
        "height": 30
      },
      "nightstand-right": {
        "src": "/assets/home/room/decor/home-nightstand-black-nightstand-right.png",
        "x": 225,
        "y": 112,
        "width": 31,
        "height": 40
      }
    },
    "home-bed-black": {
      "bed": {
        "src": "/assets/home/room/decor/home-bed-black-bed.png",
        "x": 164,
        "y": 62,
        "width": 69,
        "height": 90
      }
    },
    "home-desk-antique": {
      "desk": {
        "src": "/assets/home/room/decor/home-desk-antique-desk.png",
        "x": 7,
        "y": 49,
        "width": 70,
        "height": 95
      }
    },
    "home-nightstand-antique": {
      "nightstand-mid": {
        "src": "/assets/home/room/decor/home-nightstand-antique-nightstand-mid.png",
        "x": 138,
        "y": 92,
        "width": 29,
        "height": 30
      },
      "nightstand-right": {
        "src": "/assets/home/room/decor/home-nightstand-antique-nightstand-right.png",
        "x": 225,
        "y": 112,
        "width": 31,
        "height": 40
      }
    },
    "home-bed-antique": {
      "bed": {
        "src": "/assets/home/room/decor/home-bed-antique-bed.png",
        "x": 164,
        "y": 62,
        "width": 69,
        "height": 90
      }
    },
    "home-lamps-white": {
      "desk-lamp": {
        "src": "/assets/home/room/decor/home-lamps-white-desk-lamp.png",
        "x": 46,
        "y": 58,
        "width": 16,
        "height": 28
      },
      "lamp-right": {
        "src": "/assets/home/room/decor/home-lamps-white-lamp-right.png",
        "x": 230,
        "y": 87,
        "width": 21,
        "height": 31
      }
    },
    "home-lamps-black": {
      "desk-lamp": {
        "src": "/assets/home/room/decor/home-lamps-black-desk-lamp.png",
        "x": 46,
        "y": 58,
        "width": 16,
        "height": 28
      },
      "lamp-right": {
        "src": "/assets/home/room/decor/home-lamps-black-lamp-right.png",
        "x": 230,
        "y": 87,
        "width": 21,
        "height": 31
      }
    },
    "home-lamps-brass": {
      "desk-lamp": {
        "src": "/assets/home/room/decor/home-lamps-brass-desk-lamp.png",
        "x": 46,
        "y": 58,
        "width": 16,
        "height": 28
      },
      "lamp-right": {
        "src": "/assets/home/room/decor/home-lamps-brass-lamp-right.png",
        "x": 230,
        "y": 87,
        "width": 21,
        "height": 31
      }
    },
    "home-chair-sage": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-sage-armchair.png",
        "x": 72,
        "y": 74,
        "width": 41,
        "height": 63
      }
    },
    "home-chair-mustard": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-mustard-armchair.png",
        "x": 72,
        "y": 74,
        "width": 41,
        "height": 63
      }
    },
    "home-chair-leather": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-leather-armchair.png",
        "x": 72,
        "y": 74,
        "width": 41,
        "height": 63
      }
    },
    "home-chair-white": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-white-armchair.png",
        "x": 72,
        "y": 74,
        "width": 41,
        "height": 63
      }
    },
    "home-chair-charcoal": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-charcoal-armchair.png",
        "x": 72,
        "y": 74,
        "width": 41,
        "height": 63
      }
    },
    "home-chair-velvet": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-velvet-armchair.png",
        "x": 72,
        "y": 74,
        "width": 41,
        "height": 63
      }
    },
    "home-blanket-yellow": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-yellow-bed-blanket.png",
        "x": 164,
        "y": 88,
        "width": 77,
        "height": 56
      }
    },
    "home-blanket-camel": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-camel-bed-blanket.png",
        "x": 164,
        "y": 88,
        "width": 77,
        "height": 56
      }
    },
    "home-blanket-white": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-white-bed-blanket.png",
        "x": 164,
        "y": 88,
        "width": 77,
        "height": 56
      }
    },
    "home-blanket-charcoal": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-charcoal-bed-blanket.png",
        "x": 164,
        "y": 88,
        "width": 77,
        "height": 56
      }
    },
    "home-blanket-burgundy": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-burgundy-bed-blanket.png",
        "x": 164,
        "y": 88,
        "width": 77,
        "height": 56
      }
    },
    "home-plush-cheese": {
      "bed-cat": {
        "src": "/assets/home/room/decor/home-plush-cheese-bed-cat.png",
        "x": 187,
        "y": 97,
        "width": 16,
        "height": 12
      }
    },
    "home-plush-black": {
      "bed-cat": {
        "src": "/assets/home/room/decor/home-plush-black-bed-cat.png",
        "x": 187,
        "y": 97,
        "width": 16,
        "height": 12
      }
    },
    "home-plush-gray": {
      "bed-cat": {
        "src": "/assets/home/room/decor/home-plush-gray-bed-cat.png",
        "x": 187,
        "y": 97,
        "width": 16,
        "height": 12
      }
    },
    "home-plant-maple": {
      "floor-plant": {
        "src": "/assets/home/room/decor/home-plant-maple-floor-plant.png",
        "x": 1,
        "y": 106,
        "width": 34,
        "height": 45
      }
    },
    "home-plant-whitepot": {
      "floor-plant": {
        "src": "/assets/home/room/decor/home-plant-whitepot-floor-plant.png",
        "x": 1,
        "y": 106,
        "width": 34,
        "height": 45
      }
    },
    "home-desktop-book": {
      "desk-paper": {
        "src": "/assets/home/room/decor/home-desktop-book-desk-paper.png",
        "x": 37,
        "y": 88,
        "width": 23,
        "height": 9
      }
    },
    "home-desktop-notebook": {
      "desk-paper": {
        "src": "/assets/home/room/decor/home-desktop-notebook-desk-paper.png",
        "x": 38,
        "y": 89,
        "width": 20,
        "height": 8
      }
    },
    "home-nighttop-clock": {
      "nightstand-plant": {
        "src": "/assets/home/room/decor/home-nighttop-clock-nightstand-plant.png",
        "x": 144,
        "y": 80,
        "width": 15,
        "height": 18
      },
      "nightstand-jar": null
    },
    "home-nighttop-vase": {
      "nightstand-plant": {
        "src": "/assets/home/room/decor/home-nighttop-vase-nightstand-plant.png",
        "x": 145,
        "y": 81,
        "width": 13,
        "height": 17
      },
      "nightstand-jar": null
    },
    "home-wall-mint": {
      "wall": {
        "src": "/assets/home/room/decor/home-wall-mint-wall.png",
        "x": 0,
        "y": 2,
        "width": 256,
        "height": 137
      }
    },
    "home-wall-sky": {
      "wall": {
        "src": "/assets/home/room/decor/home-wall-sky-wall.png",
        "x": 0,
        "y": 2,
        "width": 256,
        "height": 137
      }
    },
    "home-wall-lemon": {
      "wall": {
        "src": "/assets/home/room/decor/home-wall-lemon-wall.png",
        "x": 0,
        "y": 2,
        "width": 256,
        "height": 137
      }
    },
    "home-curtain-pink": {
      "curtains": {
        "src": "/assets/home/room/decor/home-curtain-pink-curtains.png",
        "x": 87,
        "y": 13,
        "width": 93,
        "height": 86
      }
    },
    "home-curtain-mint": {
      "curtains": {
        "src": "/assets/home/room/decor/home-curtain-mint-curtains.png",
        "x": 87,
        "y": 13,
        "width": 93,
        "height": 86
      }
    },
    "home-curtain-yellow": {
      "curtains": {
        "src": "/assets/home/room/decor/home-curtain-yellow-curtains.png",
        "x": 87,
        "y": 13,
        "width": 93,
        "height": 86
      }
    },
    "home-lamps-mint": {
      "desk-lamp": {
        "src": "/assets/home/room/decor/home-lamps-mint-desk-lamp.png",
        "x": 46,
        "y": 58,
        "width": 16,
        "height": 28
      },
      "lamp-right": {
        "src": "/assets/home/room/decor/home-lamps-mint-lamp-right.png",
        "x": 230,
        "y": 87,
        "width": 21,
        "height": 31
      }
    },
    "home-lamps-pink": {
      "desk-lamp": {
        "src": "/assets/home/room/decor/home-lamps-pink-desk-lamp.png",
        "x": 46,
        "y": 58,
        "width": 16,
        "height": 28
      },
      "lamp-right": {
        "src": "/assets/home/room/decor/home-lamps-pink-lamp-right.png",
        "x": 230,
        "y": 87,
        "width": 21,
        "height": 31
      }
    },
    "home-chair-sky": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-sky-armchair.png",
        "x": 72,
        "y": 74,
        "width": 41,
        "height": 63
      }
    },
    "home-blanket-pink": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-pink-bed-blanket.png",
        "x": 164,
        "y": 88,
        "width": 77,
        "height": 56
      }
    },
    "home-blanket-sky": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-sky-bed-blanket.png",
        "x": 164,
        "y": 88,
        "width": 77,
        "height": 56
      }
    },
    "home-rug-pink": {
      "rug": {
        "src": "/assets/home/room/decor/home-rug-pink-rug.png",
        "x": 51,
        "y": 118,
        "width": 129,
        "height": 34
      }
    },
    "home-rug-mint": {
      "rug": {
        "src": "/assets/home/room/decor/home-rug-mint-rug.png",
        "x": 51,
        "y": 118,
        "width": 129,
        "height": 34
      }
    },
    "home-rug-sky": {
      "rug": {
        "src": "/assets/home/room/decor/home-rug-sky-rug.png",
        "x": 51,
        "y": 118,
        "width": 129,
        "height": 34
      }
    }
  }
} as const;
