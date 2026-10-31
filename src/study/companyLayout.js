// 첨부 원본은 별도 보존하며, 화면용 사본은 출입구의 합쳐진 인물·이름표만 제거합니다.
export const COMPANY_ORIGINAL = "/assets/company-study-room-final.png";
export const COMPANY_BACKGROUND =
  "/assets/company-study-room-final-display.png";
/** Story 009: 화면용 사본의 방 영역(view)을 절반으로 다시 그린 도트 방 672×432 (tools/art/company-room.mjs). 화면에 1배로 그린다. */
export const COMPANY_ROOM_ART = "/assets/rooms/company-room.png";
export { companyFinalLayout as companyLayout } from "./companyFinalLayout.js";

/**
 * 도트 방 그림을 무대(원본 전체 비율) 안의 view 자리에 놓는 위치와 크기 (백분율).
 * @example roomArtBox({ image: { width: 1705, height: 922 }, view: { x: 0, y: 58, width: 1344, height: 864 } }).width // "78.82…%"
 */
export const roomArtBox = ({ image, view }) => ({
  left: `${(view.x / image.width) * 100}%`,
  top: `${(view.y / image.height) * 100}%`,
  width: `${(view.width / image.width) * 100}%`,
  height: `${(view.height / image.height) * 100}%`,
});

/**
 * 착석한 사람의 하체를 가리는 책상 전경: 원본 전체 기준 사각형(rect)을 도트 방 그림 안 백분율 잘라내기로 바꾼다.
 * @example foregroundClip({ left: 0.343, right: 0.466, top: 0.481, bottom: 0.605 }, companyLayout)
 */
export const foregroundClip = (rect, { image, view }) => {
  const x = (v) => `${((v * image.width - view.x) / view.width) * 100}%`;
  const y = (v) => `${((v * image.height - view.y) / view.height) * 100}%`;
  return `polygon(${x(rect.left)} ${y(rect.top)},${x(rect.right)} ${y(rect.top)},${x(rect.right)} ${y(rect.bottom)},${x(rect.left)} ${y(rect.bottom)})`;
};

/**
 * 책상 자리(왼쪽, 오른쪽, 앞면)를 무대 위 위치와 크기(백분율)로. 자리 좌표는 도트 방 그림 칸이고 그림 1칸은 원본 2px이다.
 * @example deskSpotBox(companyLayout.seats[0], "left", companyLayout).width // 자리 폭 32칸을 원본 폭에 대한 백분율로
 */
export const deskSpotBox = (seat, spot, layout) => deskBox(seat, layout.deskSpots[spot], layout);

/**
 * 책상 안 상자(그림 칸 x, y, width, height)를 무대 위 위치와 크기(백분율)로.
 * @example deskBox(companyLayout.seats[0], companyLayout.deskMonitor, companyLayout)
 */
export const deskBox = (seat, s, { image, view }) => {
  return {
    left: `${((view.x + 2 * (seat.desk.x + s.x)) / image.width) * 100}%`,
    top: `${((view.y + 2 * (seat.desk.y + s.y)) / image.height) * 100}%`,
    width: `${((2 * s.width) / image.width) * 100}%`,
    height: `${((2 * s.height) / image.height) * 100}%`,
  };
};

/**
 * 방 그림 칸 상자(x, y, width, height)를 무대 위 위치와 크기(백분율)로. 공용 꾸밈 자리(decorSlots)에 쓴다.
 * @example artBox(companyLayout.decorSlots[0].box, companyLayout)
 */
export const artBox = (box, layout) => deskBox({ desk: { x: 0, y: 0 } }, box, layout);
