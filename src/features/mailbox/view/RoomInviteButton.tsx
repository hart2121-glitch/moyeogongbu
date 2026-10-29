import { useState } from "react";
import { useFriends } from "../../friends/viewmodel/useFriends";
import type { Room } from "../../room/model/room";
import { ROOM_CONFIG } from "../../room/model/roomConfig";
import { useRoomInvite } from "../viewmodel/useMailbox";

/** 방 툴바의 "친구 초대". 방 멤버 누구나, 방이 6명으로 가득 차 있으면 보낼 수 없다. */
export default function RoomInviteButton({ room }: { room: Room }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const friends = useFriends().data ?? [];
  const { invite } = useRoomInvite();
  const full = room.memberCount >= ROOM_CONFIG.maxMembers;
  const send = async (friendId: string, name: string) => {
    try {
      await invite(room.id, friendId);
      setNote(`${name}님에게 초대를 보냈어요.`);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "초대하지 못했어요.");
    }
  };
  return (
    <div className="room-invite">
      <button onClick={() => setOpen((v) => !v)} disabled={full} aria-expanded={open}>
        친구 초대
      </button>
      {full && <span className="muted">방이 가득 차서 초대할 수 없어요</span>}
      {open && !full && (
        <div className="room-invite-list" role="group" aria-label="초대할 친구">
          {friends.length === 0 && <span className="muted">초대할 친구가 없어요.</span>}
          {friends.map((f) => (
            <button key={f.userId} onClick={() => void send(f.userId, f.name)}>
              {f.name} 초대
            </button>
          ))}
        </div>
      )}
      {note && <span role="status">{note}</span>}
    </div>
  );
}
