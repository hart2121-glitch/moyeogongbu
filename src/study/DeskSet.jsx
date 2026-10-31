import { DESK_ITEM_ART } from "../config/shop";
import { companyLayout, deskSpotBox } from "./companyLayout";

const SPOTS = [
  ["left", "desk_left"],
  ["right", "desk_right"],
  ["front", "desk_front"],
];

/**
 * 한 사람의 내 책상 세트를 그 사람이 차지한 책상에 1배로 얹는다 (꾸미기 슬롯 계획 1절).
 * 앉아 있으면 하체를 가리는 책상 전경보다 앞(front), 아니면 방 그림 바로 위에 그린다.
 * @param {{ seat: any, look: { desk_left: string | null, desk_right: string | null, desk_front: string | null }, front?: boolean, owner?: string }} props
 */
export default function DeskSet({ seat, look, front = false, owner = "" }) {
  return SPOTS.map(([spot, field]) => {
    const src = look[field] && DESK_ITEM_ART[look[field]];
    return src ? (
      <img
        key={spot}
        className={`desk-item${front ? " is-front" : ""}`}
        src={src}
        alt=""
        aria-hidden="true"
        draggable={false}
        data-seat={seat.id}
        data-spot={spot}
        data-item={look[field]}
        data-owner={owner || undefined}
        style={deskSpotBox(seat, spot, companyLayout)}
      />
    ) : null;
  });
}
