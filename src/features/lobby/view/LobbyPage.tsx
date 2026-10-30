import { useRef, useState } from "react";
import PendingSettlementPopup from "../../coins/view/PendingSettlementPopup";
import { facingToward, type Facing } from "../model/lobbyScene";
import DeskScene from "./DeskScene";
import FriendPhone from "./FriendPhone";
import NoticeBoard from "./NoticeBoard";
import RoomMonitor from "./RoomMonitor";
import TaskMemo from "./TaskMemo";
import "./lobby.css";

const centerOf = (el: Element) => {
  const box = el.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};

/**
 * 로비 화면: 내 책상 자리 (2026-10-30 재설계). 장면 속 물건이 기능 입구다.
 * 모니터는 출근, 메모지는 할 일, 코르크판은 공지, 휴대폰은 친구. 물건을 가리키면 캐릭터가 실제 위치를 보고 그쪽으로 돈다.
 */
export default function LobbyPage() {
  const [facing, setFacing] = useState<Facing>("down");
  const characterRef = useRef<HTMLDivElement>(null);
  const look = (target: HTMLElement | null) => {
    const character = characterRef.current;
    setFacing(target && character ? facingToward(centerOf(character), centerOf(target)) : "down");
  };
  return (
    <>
      <div className="desk-lobby">
        <div className="desk-main">
          <DeskScene facing={facing} characterRef={characterRef} />
          <div className="desk-surface">
            <RoomMonitor onLook={look} />
            <TaskMemo onLook={look} />
          </div>
        </div>
        <div className="desk-side">
          <NoticeBoard onLook={look} />
          <FriendPhone onLook={look} />
        </div>
      </div>
      <PendingSettlementPopup />
    </>
  );
}
