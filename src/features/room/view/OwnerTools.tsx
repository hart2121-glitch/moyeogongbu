import { useState, type FormEvent } from "react";
import type { MemberStatus, Room } from "../model/room";
import { ROOM_CONFIG } from "../model/roomConfig";
import { useOwnerTools } from "../viewmodel/useOwnerTools";

interface Props {
  room: Room;
  members: MemberStatus[];
  onChanged: () => void;
}

/** 방장 도구: 방 이름 변경, 초대 코드 재발급, 강퇴, 강퇴 풀기. */
export default function OwnerTools({ room, members, onChanged }: Props) {
  const tools = useOwnerTools(room.id, room.isOwner, onChanged);
  const [name, setName] = useState(room.name);
  const [message, setMessage] = useState("");
  const run = async (action: () => Promise<void>, done: string) => {
    try {
      await action();
      setMessage(done);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "처리하지 못했어요.");
    }
  };
  const rename = (e: FormEvent) => {
    e.preventDefault();
    void run(() => tools.rename(name), "방 이름을 바꿨어요.");
  };
  return (
    <details className="room-owner-tools" data-testid="owner-tools">
      <summary>방장 도구</summary>
      <form onSubmit={rename}>
        <label htmlFor="owner-room-name">방 이름</label>
        <input
          id="owner-room-name"
          maxLength={ROOM_CONFIG.nameMaxLength}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit">이름 바꾸기</button>
      </form>
      <p>
        초대 코드 <code>{room.inviteCode}</code>{" "}
        <button type="button" onClick={() => void run(tools.reissue, "새 초대 코드를 만들었어요.")}>
          초대 코드 재발급
        </button>
      </p>
      <h3>멤버</h3>
      <ul>
        {members.map((m) => (
          <li key={m.userId}>
            {m.displayName}
            {m.isOwner ? (
              " (방장)"
            ) : (
              <button
                type="button"
                onClick={() => void run(() => tools.kick(m.userId), `${m.displayName} 님을 강퇴했어요.`)}
                aria-label={`${m.displayName} 강퇴`}
              >
                강퇴
              </button>
            )}
          </li>
        ))}
      </ul>
      <h3>강퇴한 사람</h3>
      {tools.bans.length === 0 ? (
        <p className="muted">강퇴한 사람이 없어요.</p>
      ) : (
        <ul>
          {tools.bans.map((b) => (
            <li key={b.userId}>
              {b.displayName}
              <button
                type="button"
                onClick={() => void run(() => tools.unban(b.userId), `${b.displayName} 님을 풀어 줬어요.`)}
                aria-label={`${b.displayName} 풀어 주기`}
              >
                풀어 주기
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && <p className="muted">{message}</p>}
    </details>
  );
}
