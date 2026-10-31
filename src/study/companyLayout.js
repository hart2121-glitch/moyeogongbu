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
