// tools/art/home-decor.mjs가 만든 파일이다. 손으로 고치지 말고 도구를 다시 돌린다.
/**
 * 로비 "내 방"을 꾸밈 자리별 층으로 다시 나눈 그림 (꾸미기 슬롯 계획 3절). 바탕 위에 draw 순서로 층을 얹는다.
 * layers는 기본 아이템의 층(1배 좌표), slots는 자리마다 바뀌는 층, items는 판매 아이템이 층마다 쓰는 그림이다
 * (null이면 그 층을 감춘다). wall, floor 층은 기본 그림이 없고 판매 아이템만 바탕 위에 덮는다.
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
    "frames-right",
    "frames-left",
    "wall-shelves",
    "curtains",
    "desk",
    "desk-paper",
    "desk-lamp",
    "nightstand-left",
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
  "layers": {
    "rug": {
      "x": 56,
      "y": 122,
      "width": 115,
      "height": 30,
      "src": "/assets/home/room/decor/default-rug.png"
    },
    "frames-right": {
      "x": 228,
      "y": 17,
      "width": 26,
      "height": 56,
      "src": "/assets/home/room/decor/default-frames-right.png"
    },
    "frames-left": {
      "x": 2,
      "y": 19,
      "width": 67,
      "height": 30,
      "src": "/assets/home/room/decor/default-frames-left.png"
    },
    "wall-shelves": {
      "x": 182,
      "y": 15,
      "width": 36,
      "height": 46,
      "src": "/assets/home/room/decor/default-wall-shelves.png"
    },
    "curtains": {
      "x": 82,
      "y": 4,
      "width": 95,
      "height": 84,
      "src": "/assets/home/room/decor/default-curtains.png"
    },
    "desk": {
      "x": 4,
      "y": 45,
      "width": 70,
      "height": 102,
      "src": "/assets/home/room/decor/default-desk.png"
    },
    "desk-paper": {
      "x": 35,
      "y": 86,
      "width": 29,
      "height": 13,
      "src": "/assets/home/room/decor/default-desk-paper.png"
    },
    "desk-lamp": {
      "x": 43,
      "y": 58,
      "width": 21,
      "height": 28,
      "src": "/assets/home/room/decor/default-desk-lamp.png"
    },
    "nightstand-left": {
      "x": 137,
      "y": 97,
      "width": 27,
      "height": 25,
      "src": "/assets/home/room/decor/default-nightstand-left.png"
    },
    "nightstand-jar": {
      "x": 137,
      "y": 85,
      "width": 9,
      "height": 12,
      "src": "/assets/home/room/decor/default-nightstand-jar.png"
    },
    "nightstand-plant": {
      "x": 143,
      "y": 71,
      "width": 22,
      "height": 26,
      "src": "/assets/home/room/decor/default-nightstand-plant.png"
    },
    "bed": {
      "x": 163,
      "y": 61,
      "width": 69,
      "height": 88,
      "src": "/assets/home/room/decor/default-bed.png"
    },
    "bed-cat": {
      "x": 191,
      "y": 79,
      "width": 15,
      "height": 9,
      "src": "/assets/home/room/decor/default-bed-cat.png"
    },
    "bed-blanket": {
      "x": 163,
      "y": 61,
      "width": 78,
      "height": 84,
      "src": "/assets/home/room/decor/default-bed-blanket.png"
    },
    "nightstand-right": {
      "x": 218,
      "y": 112,
      "width": 38,
      "height": 40,
      "src": "/assets/home/room/decor/default-nightstand-right.png"
    },
    "lamp-right": {
      "x": 231,
      "y": 87,
      "width": 22,
      "height": 32,
      "src": "/assets/home/room/decor/default-lamp-right.png"
    },
    "armchair": {
      "x": 65,
      "y": 75,
      "width": 53,
      "height": 62,
      "src": "/assets/home/room/decor/default-armchair.png"
    },
    "floor-plant": {
      "x": 0,
      "y": 100,
      "width": 37,
      "height": 52,
      "src": "/assets/home/room/decor/default-floor-plant.png"
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
    "curtains": [
      "curtains"
    ],
    "frames": [
      "frames-left",
      "frames-right"
    ],
    "shelves": [
      "wall-shelves"
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
    "armchair": [
      "armchair"
    ],
    "nightstands": [
      "nightstand-left",
      "nightstand-right"
    ],
    "nightstand_top": [
      "nightstand-jar",
      "nightstand-plant"
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
    "floor_plant": [
      "floor-plant"
    ]
  },
  "items": {
    "home-wall-mint": {
      "wall": {
        "src": "/assets/home/room/decor/home-wall-mint-wall.png",
        "x": 0,
        "y": 3,
        "width": 256,
        "height": 135
      }
    },
    "home-wall-sky": {
      "wall": {
        "src": "/assets/home/room/decor/home-wall-sky-wall.png",
        "x": 0,
        "y": 3,
        "width": 256,
        "height": 135
      }
    },
    "home-wall-lemon": {
      "wall": {
        "src": "/assets/home/room/decor/home-wall-lemon-wall.png",
        "x": 0,
        "y": 3,
        "width": 256,
        "height": 135
      }
    },
    "home-floor-maple": {
      "floor": {
        "src": "/assets/home/room/decor/home-floor-maple-floor.png",
        "x": 0,
        "y": 108,
        "width": 256,
        "height": 44
      }
    },
    "home-floor-walnut": {
      "floor": {
        "src": "/assets/home/room/decor/home-floor-walnut-floor.png",
        "x": 0,
        "y": 108,
        "width": 256,
        "height": 44
      }
    },
    "home-floor-gray": {
      "floor": {
        "src": "/assets/home/room/decor/home-floor-gray-floor.png",
        "x": 0,
        "y": 108,
        "width": 256,
        "height": 44
      }
    },
    "home-curtain-pink": {
      "curtains": {
        "src": "/assets/home/room/decor/home-curtain-pink-curtains.png",
        "x": 82,
        "y": 4,
        "width": 95,
        "height": 84
      }
    },
    "home-curtain-mint": {
      "curtains": {
        "src": "/assets/home/room/decor/home-curtain-mint-curtains.png",
        "x": 82,
        "y": 4,
        "width": 95,
        "height": 84
      }
    },
    "home-curtain-yellow": {
      "curtains": {
        "src": "/assets/home/room/decor/home-curtain-yellow-curtains.png",
        "x": 82,
        "y": 4,
        "width": 95,
        "height": 84
      }
    },
    "home-blanket-pink": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-pink-bed-blanket.png",
        "x": 163,
        "y": 61,
        "width": 78,
        "height": 84
      }
    },
    "home-blanket-sky": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-sky-bed-blanket.png",
        "x": 163,
        "y": 61,
        "width": 78,
        "height": 84
      }
    },
    "home-blanket-yellow": {
      "bed-blanket": {
        "src": "/assets/home/room/decor/home-blanket-yellow-bed-blanket.png",
        "x": 163,
        "y": 61,
        "width": 78,
        "height": 84
      }
    },
    "home-rug-pink": {
      "rug": {
        "src": "/assets/home/room/decor/home-rug-pink-rug.png",
        "x": 56,
        "y": 122,
        "width": 115,
        "height": 30
      }
    },
    "home-rug-mint": {
      "rug": {
        "src": "/assets/home/room/decor/home-rug-mint-rug.png",
        "x": 56,
        "y": 122,
        "width": 115,
        "height": 30
      }
    },
    "home-rug-sky": {
      "rug": {
        "src": "/assets/home/room/decor/home-rug-sky-rug.png",
        "x": 56,
        "y": 122,
        "width": 115,
        "height": 30
      }
    },
    "home-chair-sage": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-sage-armchair.png",
        "x": 65,
        "y": 75,
        "width": 53,
        "height": 62
      }
    },
    "home-chair-sky": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-sky-armchair.png",
        "x": 65,
        "y": 75,
        "width": 53,
        "height": 62
      }
    },
    "home-chair-mustard": {
      "armchair": {
        "src": "/assets/home/room/decor/home-chair-mustard-armchair.png",
        "x": 65,
        "y": 75,
        "width": 53,
        "height": 62
      }
    },
    "home-lamps-mint": {
      "desk-lamp": {
        "src": "/assets/home/room/decor/home-lamps-mint-desk-lamp.png",
        "x": 43,
        "y": 58,
        "width": 21,
        "height": 28
      },
      "lamp-right": {
        "src": "/assets/home/room/decor/home-lamps-mint-lamp-right.png",
        "x": 231,
        "y": 87,
        "width": 22,
        "height": 32
      }
    },
    "home-lamps-pink": {
      "desk-lamp": {
        "src": "/assets/home/room/decor/home-lamps-pink-desk-lamp.png",
        "x": 43,
        "y": 58,
        "width": 21,
        "height": 28
      },
      "lamp-right": {
        "src": "/assets/home/room/decor/home-lamps-pink-lamp-right.png",
        "x": 231,
        "y": 87,
        "width": 22,
        "height": 32
      }
    },
    "home-plush-cheese": {
      "bed-cat": {
        "src": "/assets/home/room/decor/home-plush-cheese-bed-cat.png",
        "x": 191,
        "y": 79,
        "width": 15,
        "height": 9
      }
    },
    "home-plush-black": {
      "bed-cat": {
        "src": "/assets/home/room/decor/home-plush-black-bed-cat.png",
        "x": 191,
        "y": 79,
        "width": 15,
        "height": 9
      }
    },
    "home-plush-gray": {
      "bed-cat": {
        "src": "/assets/home/room/decor/home-plush-gray-bed-cat.png",
        "x": 191,
        "y": 79,
        "width": 15,
        "height": 9
      }
    },
    "home-plant-maple": {
      "floor-plant": {
        "src": "/assets/home/room/decor/home-plant-maple-floor-plant.png",
        "x": 0,
        "y": 100,
        "width": 37,
        "height": 52
      }
    },
    "home-plant-whitepot": {
      "floor-plant": {
        "src": "/assets/home/room/decor/home-plant-whitepot-floor-plant.png",
        "x": 0,
        "y": 100,
        "width": 37,
        "height": 52
      }
    },
    "home-desk-white": {
      "desk": {
        "src": "/assets/home/room/decor/home-desk-white-desk.png",
        "x": 4,
        "y": 45,
        "width": 70,
        "height": 102
      }
    },
    "home-desk-walnut": {
      "desk": {
        "src": "/assets/home/room/decor/home-desk-walnut-desk.png",
        "x": 4,
        "y": 45,
        "width": 70,
        "height": 102
      }
    },
    "home-bed-white": {
      "bed": {
        "src": "/assets/home/room/decor/home-bed-white-bed.png",
        "x": 163,
        "y": 61,
        "width": 69,
        "height": 88
      }
    },
    "home-bed-walnut": {
      "bed": {
        "src": "/assets/home/room/decor/home-bed-walnut-bed.png",
        "x": 163,
        "y": 61,
        "width": 69,
        "height": 88
      }
    },
    "home-nightstand-white": {
      "nightstand-left": {
        "src": "/assets/home/room/decor/home-nightstand-white-nightstand-left.png",
        "x": 137,
        "y": 97,
        "width": 27,
        "height": 25
      },
      "nightstand-right": {
        "src": "/assets/home/room/decor/home-nightstand-white-nightstand-right.png",
        "x": 218,
        "y": 112,
        "width": 38,
        "height": 40
      }
    },
    "home-nightstand-walnut": {
      "nightstand-left": {
        "src": "/assets/home/room/decor/home-nightstand-walnut-nightstand-left.png",
        "x": 137,
        "y": 97,
        "width": 27,
        "height": 25
      },
      "nightstand-right": {
        "src": "/assets/home/room/decor/home-nightstand-walnut-nightstand-right.png",
        "x": 218,
        "y": 112,
        "width": 38,
        "height": 40
      }
    },
    "home-frames-white": {
      "frames-left": {
        "src": "/assets/home/room/decor/home-frames-white-frames-left.png",
        "x": 2,
        "y": 19,
        "width": 67,
        "height": 30
      },
      "frames-right": {
        "src": "/assets/home/room/decor/home-frames-white-frames-right.png",
        "x": 228,
        "y": 17,
        "width": 26,
        "height": 56
      }
    },
    "home-frames-black": {
      "frames-left": {
        "src": "/assets/home/room/decor/home-frames-black-frames-left.png",
        "x": 2,
        "y": 19,
        "width": 67,
        "height": 30
      },
      "frames-right": {
        "src": "/assets/home/room/decor/home-frames-black-frames-right.png",
        "x": 228,
        "y": 17,
        "width": 26,
        "height": 56
      }
    },
    "home-shelves-white": {
      "wall-shelves": {
        "src": "/assets/home/room/decor/home-shelves-white-wall-shelves.png",
        "x": 182,
        "y": 15,
        "width": 36,
        "height": 46
      }
    },
    "home-desktop-book": {
      "desk-paper": {
        "src": "/assets/home/room/decor/home-desktop-book-desk-paper.png",
        "x": 35,
        "y": 86,
        "width": 29,
        "height": 13
      }
    },
    "home-desktop-notebook": {
      "desk-paper": {
        "src": "/assets/home/room/decor/home-desktop-notebook-desk-paper.png",
        "x": 35,
        "y": 86,
        "width": 29,
        "height": 13
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
    }
  }
} as const;
