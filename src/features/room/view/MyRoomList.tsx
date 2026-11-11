import { DoorOpen, Key, Plus, Users } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import CopyButton from "../../shell/view/CopyButton";
import type { Room } from "../model/room";
import { ROOM_CONFIG } from "../model/roomConfig";
import { useMyRooms, useRoomActions } from "../viewmodel/useMyRooms";
import "./roomList.css";

/** 방 나가기 확인 문구. 방장이 나가면 가장 오래 함께한 멤버가 방장이 되고, 혼자면 방이 사라진다 (서버 room_remove_member). */
const leaveText = (room: Room) =>
  !room.isOwner
    ? `${room.name}에서 나갈까요?`
    : room.memberCount <= 1
      ? `${room.name}에서 나가면 방이 사라져요. 나갈까요?`
      : `${room.name}에서 나가면 가장 오래 함께한 멤버가 방장이 돼요. 나갈까요?`;

/**
 * 스터디룸 목록: 방 만들기, 초대 코드로 들어가기, "내 방 목록" (서버). 방 나가기는 한 번 더 묻는다.
 */
export default function MyRoomList({ onEnter }: { onEnter: (room: Room) => void }) {
  const rooms = useMyRooms();
  const actions = useRoomActions();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Room | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const list = rooms.data ?? [];
  const owned = list.filter((r) => r.isOwner).length;

  const guard = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "처리하지 못했어요.");
    } finally {
      setBusy(false);
    }
  };
  const create = (e: FormEvent) => {
    e.preventDefault();
    void guard(async () => {
      setCreated(await actions.create(name));
      setName("");
    });
  };
  const join = (e: FormEvent) => {
    e.preventDefault();
    void guard(async () => onEnter(await actions.join(code.trim())));
  };
  const leave = (room: Room) =>
    void guard(async () => {
      await actions.leave(room.id);
      setLeaving(null);
      if (created?.id === room.id) setCreated(null);
    });

  return (
    <div className="study-room-list">
      <div className="page-intro">
        <h1>함께 집중할 나만의 공간</h1>
      </div>
      <div className="room-forms">
        <form onSubmit={create}>
          <h2>
            <Plus /> 스터디룸 만들기
          </h2>
          <label htmlFor="room-name">방 이름</label>
          <input
            id="room-name"
            maxLength={ROOM_CONFIG.nameMaxLength}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 밍구의 회사"
          />
          <p className="muted">
            내가 만든 방 {owned}/{ROOM_CONFIG.maxOwnedRooms}
          </p>
          <button className="primary" type="submit" disabled={busy || owned >= ROOM_CONFIG.maxOwnedRooms}>
            방 만들기
          </button>
        </form>
        <form onSubmit={join}>
          <h2>
            <Key /> 초대 코드로 입장하기
          </h2>
          <label htmlFor="room-code">초대 코드</label>
          <input
            id="room-code"
            maxLength={ROOM_CONFIG.inviteCodeLength}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={`${ROOM_CONFIG.inviteCodeLength}자리 초대 코드`}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="primary" type="submit" disabled={busy}>
            코드로 입장하기
          </button>
        </form>
      </div>
      {error && (
        <p className="room-error" role="alert">
          {error}
        </p>
      )}
      {created && (
        <div className="room-created" role="status">
          <span>
            ‘{created.name}’ 방을 만들었어요. 초대 코드 <strong>{created.inviteCode}</strong>
          </span>
          <button className="primary" onClick={() => onEnter(created)}>
            만든 방 입장하기
          </button>
        </div>
      )}
      <section className="room-list-section">
        <h2>내 방 목록</h2>
        {rooms.isError ? (
          <p className="room-error" role="alert">
            방 목록을 불러오지 못했어요.
          </p>
        ) : list.length === 0 ? (
          <p className="muted">{rooms.isPending ? "방 목록을 불러오는 중이에요." : "아직 들어간 방이 없어요."}</p>
        ) : (
          <ul className="local-room-list">
            {list.map((room) => (
              <li key={room.id}>
                <DoorOpen className="room-row-icon" weight="duotone" aria-hidden="true" />
                <div className="room-row-main">
                  <h3>{room.name}</h3>
                  <p>
                    <Users size={16} aria-hidden="true" /> 멤버 {room.memberCount}/{ROOM_CONFIG.maxMembers}, 지금{" "}
                    {room.onlineCount}명, {room.isOwner ? "내가 만든 방" : "초대받은 방"}
                  </p>
                </div>
                <div className="room-row-code">
                  <span>초대 코드</span>
                  <code>{room.inviteCode}</code>
                  <CopyButton text={room.inviteCode} label={`${room.name} 초대 코드 복사`} />
                </div>
                {leaving === room.id ? (
                  <div className="room-row-actions room-leave-confirm" role="group" aria-label={`${room.name} 나가기 확인`}>
                    <p>{leaveText(room)}</p>
                    <button className="primary danger" onClick={() => leave(room)} disabled={busy}>
                      나가기
                    </button>
                    <button className="secondary-button" onClick={() => setLeaving(null)} disabled={busy}>
                      취소
                    </button>
                  </div>
                ) : (
                  <div className="room-row-actions">
                    <button className="primary" onClick={() => onEnter(room)} aria-label={`${room.name} 입장`}>
                      입장하기
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => setLeaving(room.id)}
                      disabled={busy}
                      aria-label={`${room.name} 나가기`}
                    >
                      방 나가기
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
