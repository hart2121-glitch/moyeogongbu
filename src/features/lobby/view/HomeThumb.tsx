import { HOME_SIZE, HOME_THUMB, homeLayers, homeThumbOrigin, type HomeLook, type HomeSlot } from "../model/homeDecor";
import HomeRoomArt from "./HomeRoomArt";

/**
 * 내 방 꾸밈 선택지 그림: 지금 꾸민 방에 이 아이템만 바꿔 놓은 모습에서 그 자리 둘레(72×44)를 정수 배율(scale)로 보인다.
 * @example <HomeThumb look={home} slot="rug" itemId="home-rug-pink" scale={2} />
 */
export default function HomeThumb({ look, slot, itemId, scale }: { look: HomeLook; slot: HomeSlot; itemId: string; scale: number }) {
  const origin = homeThumbOrigin(slot);
  return (
    <span className="home-thumb" style={{ width: HOME_THUMB.width * scale, height: HOME_THUMB.height * scale }}>
      <span
        className="home-thumb-room"
        style={{ left: -origin.x * scale, top: -origin.y * scale, width: HOME_SIZE.width * scale, height: HOME_SIZE.height * scale }}
      >
        <HomeRoomArt scale={scale} layers={homeLayers({ ...look, [slot]: itemId })} />
      </span>
    </span>
  );
}
