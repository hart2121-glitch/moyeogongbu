import type { CSSProperties } from "react";
import { DESK_ITEM_ART } from "../../../config/shop";
import { COMPANY_ROOM_ART, companyLayout } from "../../../study/companyLayout";
import type { DeskSpot, Look } from "../model/layers";

/** 회사 방 그림에서 잘라 보여 줄 책상 (1번 자리 빈 책상, 그림 칸 112×84). */
const DESK = { ...companyLayout.seats[0].desk, width: 112, height: 84 };
const ROOM = { width: 672, height: 432 };
const SCALE = 2;
const SPOTS: readonly ["left" | "right" | "front", DeskSpot][] = [
  ["left", "desk_left"],
  ["right", "desk_right"],
  ["front", "desk_front"],
];

/**
 * 꾸미기 "책상" 탭의 미리보기: 회사 방의 빈 책상을 정수 2배로 잘라 보이고, 고른 세트를 방과 같은 자리에 얹는다.
 * @example <DeskPreview look={c.look} label="내 책상 미리보기" />
 */
export default function DeskPreview({ look, label }: { look: Look; label: string }) {
  const desk: CSSProperties = {
    width: DESK.width * SCALE,
    height: DESK.height * SCALE,
    backgroundImage: `url("${COMPANY_ROOM_ART}")`,
    backgroundSize: `${ROOM.width * SCALE}px ${ROOM.height * SCALE}px`,
    backgroundPosition: `${-DESK.x * SCALE}px ${-DESK.y * SCALE}px`,
  };
  return (
    <div className="desk-preview" role="img" aria-label={label} style={desk} data-testid="desk-preview">
      {SPOTS.map(([spot, field]) => {
        const id = look[field];
        const src = id && DESK_ITEM_ART[id];
        if (!src) return null;
        const s = companyLayout.deskSpots[spot];
        return (
          <img
            key={spot}
            src={src}
            alt=""
            data-spot={spot}
            data-item={id}
            style={{ left: s.x * SCALE, top: s.y * SCALE, width: s.width * SCALE, height: s.height * SCALE }}
          />
        );
      })}
    </div>
  );
}
