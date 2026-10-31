/**
 * 로그인과 환영 화면의 "집 현관" 장면 설정 (2026-10-31, 내 방과 같은 분위기). 그림은 `node tools/art/home-entrance.mjs`가 만든다.
 * 좌표는 모두 그림 안 1배 도트 px이고, 화면은 같은 정수 배율로 키워 그린다 (넓은 화면 3배, 좁은 화면 2배: authFrame.css).
 */
export const ENTRANCE_SCENE = {
  art: "/assets/home/entrance/entrance.png",
  sign: "/assets/home/entrance/sign.png",
  size: { width: 240, height: 144 },
  /** 문 위 문패: 가운데 x, 위 y, 높이와 가장 좁은 폭. 이름이 길면 가운데를 기준으로 양옆으로 늘어난다. */
  signBox: { centerX: 118, top: 18, height: 16, minWidth: 53 },
  /** 문 앞 매트 위 캐릭터 발 중심. */
  feet: { x: 118, y: 131 },
} as const;
