// tools/art/home-decor.mjs가 만든 파일이다. 손으로 고치지 말고 도구를 다시 돌린다.
/**
 * 로비 "내 방"을 꾸밈 자리별 층으로 나눈 그림 (꾸미기 슬롯 계획 3절). 바탕(빈 방) 위에 draw 순서로 층을 얹는다.
 * layers는 기본 아이템의 층(1배 좌표), slots는 자리마다 바뀌는 층, items는 판매 아이템이 층마다 쓰는 그림이다
 * (null이면 그 층을 감춘다). wall, floor 층은 기본 그림이 없고 판매 아이템만 바탕 위에 덮는다.
 * fixed 층(그림자)은 자리 없이 늘 그리고, blend로 아래 그림과 섞는다 (multiply).
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
    "rug",
    "shadow",
    "frames-left",
    "wall-shelves",
    "curtains",
    "curtain-rod",
    "desk",
    "desk-paper",
    "desk-lamp",
    "nightstand",
    "nightstand-top",
    "lamp-right",
    "bed",
    "bed-blanket",
    "bed-cat",
    "armchair",
    "floor-plant"
  ],
  "fixed": [
    "shadow"
  ],
  "layers": {
    "rug": {
      "x": 51,
      "y": 118,
      "width": 129,
      "height": 34,
      "src": "/assets/home/room/decor/rug.png"
    },
    "shadow": {
      "x": 2,
      "y": 121,
      "width": 251,
      "height": 31,
      "src": "/assets/home/room/decor/shadow.png",
      "blend": "multiply"
    },
    "frames-left": {
      "x": 46,
      "y": 29,
      "width": 41,
      "height": 16,
      "src": "/assets/home/room/decor/frames-left.png"
    },
    "wall-shelves": {
      "x": 188,
      "y": 27,
      "width": 32,
      "height": 32,
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
      "width": 100,
      "height": 7,
      "src": "/assets/home/room/decor/curtain-rod.png"
    },
    "desk": {
      "x": 22,
      "y": 51,
      "width": 56,
      "height": 81,
      "src": "/assets/home/room/decor/desk.png"
    },
    "desk-paper": {
      "x": 27,
      "y": 85,
      "width": 25,
      "height": 16,
      "src": "/assets/home/room/decor/desk-paper.png"
    },
    "desk-lamp": {
      "x": 56,
      "y": 73,
      "width": 18,
      "height": 28,
      "src": "/assets/home/room/decor/desk-lamp.png"
    },
    "nightstand": {
      "x": 130,
      "y": 97,
      "width": 34,
      "height": 28,
      "src": "/assets/home/room/decor/nightstand.png"
    },
    "nightstand-top": {
      "x": 132,
      "y": 72,
      "width": 16,
      "height": 28,
      "src": "/assets/home/room/decor/nightstand-top.png"
    },
    "lamp-right": {
      "x": 145,
      "y": 72,
      "width": 18,
      "height": 28,
      "src": "/assets/home/room/decor/lamp-right.png"
    },
    "bed": {
      "x": 175,
      "y": 73,
      "width": 66,
      "height": 78,
      "src": "/assets/home/room/decor/bed.png"
    },
    "bed-blanket": {
      "x": 166,
      "y": 107,
      "width": 84,
      "height": 43,
      "src": "/assets/home/room/decor/bed-blanket.png"
    },
    "bed-cat": {
      "x": 216,
      "y": 108,
      "width": 23,
      "height": 16,
      "src": "/assets/home/room/decor/bed-cat.png"
    },
    "armchair": {
      "x": 82,
      "y": 84,
      "width": 48,
      "height": 57,
      "src": "/assets/home/room/decor/armchair.png"
    },
    "floor-plant": {
      "x": 0,
      "y": 101,
      "width": 36,
      "height": 50,
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
      "nightstand"
    ],
    "nightstand_top": [
      "nightstand-top"
    ],
    "bed": [
      "bed"
    ],
    "blanket": [
      "bed-blanket"
    ],
    "plush": [
      "bed-cat"
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
        "width": 100,
        "height": 7
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
        "width": 100,
        "height": 7
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
        "width": 100,
        "height": 7
      }
    },
    "home-frames-walnut": {
      "frames-left": {
        "src": "/assets/home/room/decor/home-frames-walnut-frames-left.png",
        "x": 46,
        "y": 29,
        "width": 41,
        "height": 16
      }
    },
    "home-frames-white": {
      "frames-left": {
        "src": "/assets/home/room/decor/home-frames-white-frames-left.png",
        "x": 46,
        "y": 29,
        "width": 41,
        "height": 16
      }
    },
    "home-frames-black": {
      "frames-left": {
        "src": "/assets/home/room/decor/home-frames-black-frames-left.png",
        "x": 46,
        "y": 29,
        "width": 41,
        "height": 16
      }
    },
    "home-frames-gold": {
      "frames-left": {
        "src": "/assets/home/room/decor/home-frames-gold-frames-left.png",
        "x": 46,
        "y": 29,
        "width": 41,
        "height": 16
      }
    },
    "home-shelves-walnut": {
      "wall-shelves": {
        "src": "/assets/home/room/decor/home-shelves-walnut-wall-shelves.png",
        "x": 188,
        "y": 27,
        "width": 32,
        "height": 32
      }
    },
    "home-shelves-white": {
      "wall-shelves": {
        "src": "/assets/home/room/decor/home-shelves-white-wall-shelves.png",
        "x": 188,
        "y": 27,
        "width": 32,
        "height": 32
      }
    },
    "home-shelves-black": {
      "wall-shelves": {
        "src": "/assets/home/room/decor/home-shelves-black-wall-shelves.png",
        "x": 188,
        "y": 27,
        "width": 32,
        "height": 32
      }
    },
    "home-desk-walnut": {
      "desk": {
        "src": "/assets/home/room/decor/home-desk-walnut-desk.png",
        "x": 22,
        "y": 51,
        "width": 56,
        "height": 81
      }
    },
    "home-nightstand-walnut": {
      "nightstand": {
        "src": "/assets/home/room/decor/home-nightstand-walnut-nightstand.png",
        "x": 130,
        "y": 97,
        "width": 34,
        "height": 28
      }
    },
    "home-bed-walnut": {
      "bed": {
        "src": "/assets/home/room/decor/home-bed-walnut-bed.png",
        "x": 175,
        "y": 73,
        "width": 66,
        "height": 78
      }
    },
    "home-desk-white": {
      "desk": {
        "src": "/assets/home/room/decor/home-desk-white-desk.png",
        "x": 22,
        "y": 51,
        "width": 56,
        "height": 81
      }
    },
    "home-nightstand-white": {
      "nightstand": {
        "src": "/assets/home/room/decor/home-nightstand-white-nightstand.png",
        "x": 130,
        "y": 97,
        "width": 34,
        "height": 28
      }
    },
    "home-bed-white": {
      "bed": {
        "src": "/assets/home/room/decor/home-bed-white-bed.png",
        "x": 175,
        "y": 73,
        "width": 66,
        "height": 78
      }
    },
    "home-desk-black": {
      "desk": {
        "src": "/assets/home/room/decor/home-desk-black-desk.png",
        "x": 22,
        "y": 51,
        "width": 56,
        "height": 81
      }
    },
    "home-nightstand-black": {
      "nightstand": {
        "src": "/assets/home/room/decor/home-nightstand-black-nightstand.png",
        "x": 130,
        "y": 97,
        "width": 34,
        "height": 28
      }
    },
    "home-bed-black": {
      "bed": {
        "src": "/assets/home/room/decor/home-bed-black-bed.png",
        "x": 175,
        "y": 73,
        "width": 66,
        "height": 78
      }
    },
    "home-desk-antique": {
      "desk": {
        "src": "/assets/home/room/decor/home-desk-antique-desk.png",
        "x": 22,
        "y": 51,
        "width": 56,
        "height": 81
      }
    },
    "home-nightstand-antique": {
      "nightstand": {
        "src": "/assets/home/room/decor/home-nightstand-antique-nightstand.png",
        "x": 130,
        "y": 97,
        "width": 34,
        "height": 28
      }
    },
    "home-bed-antique": {
      "bed": {
        "src": "/assets/home/room/decor/home-bed-antique-bed.png",
        "x": 175,
        "y": 73,
        "width": 66,
        "height": 78
      }
    },
    "home-lamps-white": {
      "desk-lamp": {
        "src": "/assets/home/room/decor/home-lamps-white-desk-lamp.png",
        "x": 56,
        "y": 73,
        "width": 18,
        "height": 28
      },
      "lamp-right": {
        "src": "/assets/home/room/decor/home-lamps-white-lamp-right.png",
        "x": 145,
        "y": 72,
        "width": 18,
        "height": 28
      }
    },
    "home-lamps-black": {
      "desk-lamp": {
        "src": "/assets/home/room/decor/home-lamps-black-desk-lamp.png",
        "x": 56,
        "y": 73,
        "width": 18,
        "height": 28
      },
      "lamp-right": {
        "src": "/assets/home/room/decor/home-lamps-black-lamp-right.png",
        "x": 145,
        "y": 72,
        "width": 18,
        "height": 28
      }
    },
    "home-lamps-brass": {
      "desk-lamp": {
        "src": "/assets/home/room/decor/home-lamps-brass-desk-lamp.png",
        "x": 56,
        "y": 73,
        "width": 18,
        "height": 28
      },
      "lamp-right": {
        "src": "/assets/home/room/decor/home-lamps-brass-lamp-right.png",
        "x": 145,
        "y": 72,
        "width": 18,
        "height": 28
      }
    },
    "home-chair-sage": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-sage-armchair.png",
        "x": 82,
        "y": 84,
        "width": 48,
        "height": 57
      }
    },
    "home-chair-mustard": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-mustard-armchair.png",
        "x": 82,
        "y": 84,
        "width": 48,
        "height": 57
      }
    },
    "home-chair-leather": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-leather-armchair.png",
        "x": 82,
        "y": 84,
        "width": 48,
        "height": 57
      }
    },
    "home-chair-white": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-white-armchair.png",
        "x": 82,
        "y": 84,
        "width": 48,
        "height": 57
      }
    },
    "home-chair-charcoal": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-charcoal-armchair.png",
        "x": 82,
        "y": 84,
        "width": 48,
        "height": 57
      }
    },
    "home-chair-velvet": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-velvet-armchair.png",
        "x": 82,
        "y": 84,
        "width": 48,
        "height": 57
      }
    },
    "home-blanket-yellow": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-yellow-bed-blanket.png",
        "x": 166,
        "y": 107,
        "width": 84,
        "height": 43
      }
    },
    "home-blanket-camel": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-camel-bed-blanket.png",
        "x": 166,
        "y": 107,
        "width": 84,
        "height": 43
      }
    },
    "home-blanket-white": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-white-bed-blanket.png",
        "x": 166,
        "y": 107,
        "width": 84,
        "height": 43
      }
    },
    "home-blanket-charcoal": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-charcoal-bed-blanket.png",
        "x": 166,
        "y": 107,
        "width": 84,
        "height": 43
      }
    },
    "home-blanket-burgundy": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-burgundy-bed-blanket.png",
        "x": 166,
        "y": 107,
        "width": 84,
        "height": 43
      }
    },
    "home-plush-cheese": {
      "bed-cat": {
        "src": "/assets/home/room/decor/home-plush-cheese-bed-cat.png",
        "x": 216,
        "y": 108,
        "width": 23,
        "height": 16
      }
    },
    "home-plush-black": {
      "bed-cat": {
        "src": "/assets/home/room/decor/home-plush-black-bed-cat.png",
        "x": 216,
        "y": 108,
        "width": 23,
        "height": 16
      }
    },
    "home-plush-gray": {
      "bed-cat": {
        "src": "/assets/home/room/decor/home-plush-gray-bed-cat.png",
        "x": 216,
        "y": 108,
        "width": 23,
        "height": 16
      }
    },
    "home-plant-maple": {
      "floor-plant": {
        "src": "/assets/home/room/decor/home-plant-maple-floor-plant.png",
        "x": 0,
        "y": 101,
        "width": 36,
        "height": 50
      }
    },
    "home-plant-whitepot": {
      "floor-plant": {
        "src": "/assets/home/room/decor/home-plant-whitepot-floor-plant.png",
        "x": 0,
        "y": 101,
        "width": 36,
        "height": 50
      }
    },
    "home-desktop-book": {
      "desk-paper": {
        "src": "/assets/home/room/decor/home-desktop-book-desk-paper.png",
        "x": 25,
        "y": 86,
        "width": 28,
        "height": 15
      }
    },
    "home-desktop-notebook": {
      "desk-paper": {
        "src": "/assets/home/room/decor/home-desktop-notebook-desk-paper.png",
        "x": 25,
        "y": 79,
        "width": 28,
        "height": 22
      }
    },
    "home-nighttop-clock": {
      "nightstand-top": {
        "src": "/assets/home/room/decor/home-nighttop-clock-nightstand-top.png",
        "x": 131,
        "y": 73,
        "width": 18,
        "height": 27
      }
    },
    "home-nighttop-vase": {
      "nightstand-top": {
        "src": "/assets/home/room/decor/home-nighttop-vase-nightstand-top.png",
        "x": 130,
        "y": 72,
        "width": 21,
        "height": 28
      }
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
        "x": 56,
        "y": 73,
        "width": 18,
        "height": 28
      },
      "lamp-right": {
        "src": "/assets/home/room/decor/home-lamps-mint-lamp-right.png",
        "x": 145,
        "y": 72,
        "width": 18,
        "height": 28
      }
    },
    "home-lamps-pink": {
      "desk-lamp": {
        "src": "/assets/home/room/decor/home-lamps-pink-desk-lamp.png",
        "x": 56,
        "y": 73,
        "width": 18,
        "height": 28
      },
      "lamp-right": {
        "src": "/assets/home/room/decor/home-lamps-pink-lamp-right.png",
        "x": 145,
        "y": 72,
        "width": 18,
        "height": 28
      }
    },
    "home-chair-sky": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-sky-armchair.png",
        "x": 82,
        "y": 84,
        "width": 48,
        "height": 57
      }
    },
    "home-blanket-pink": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-pink-bed-blanket.png",
        "x": 166,
        "y": 107,
        "width": 84,
        "height": 43
      }
    },
    "home-blanket-sky": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-sky-bed-blanket.png",
        "x": 166,
        "y": 107,
        "width": 84,
        "height": 43
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
