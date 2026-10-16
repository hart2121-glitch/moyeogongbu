import { useState } from "react";
import { Plus, Users, Key } from "@phosphor-icons/react";
export default function RoomList({
  rooms,
  createRoom,
  onEnter,
  storageWarning,
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const create = (e) => {
    e.preventDefault();
    setError("");
    try {
      const room = createRoom(name);
      setCreated(room);
      setName("");
    } catch (error) {
      setError(error.message);
    }
  };
  const join = (e) => {
    e.preventDefault();
    const room = rooms.find((r) => r.code === code.trim().toUpperCase());
    if (!room) {
      setError(
        "이 브라우저에 등록된 초대 코드가 아니에요. 로컬 데모에서는 다른 기기의 방에 입장할 수 없어요.",
      );
      return;
    }
    setError("");
    onEnter(room);
  };
  const section = (title, kind) => (
    <section className="room-list-section">
      <h2>{title}</h2>
      {rooms.filter((r) => r.kind === kind).length === 0 ? (
        <p className="muted">
          아직 만든 방이 없어요. 새 회사 스터디룸을 만들어 보세요.
        </p>
      ) : (
        <ul className="local-room-list">
          {rooms
            .filter((r) => r.kind === kind)
            .map((room) => (
              <li key={room.id}>
                <div>
                  <h3>{room.name}</h3>
                  <p>
                    <Users size={16} /> 최대 {room.capacity}명 · 회사 테마 ·
                    로컬 데모
                  </p>
                  <p>
                    초대 코드 <code>{room.code}</code>
                    {room.kind === "invited" && " · 예시 초대"}
                  </p>
                </div>
                <button
                  className="primary"
                  onClick={() => onEnter(room)}
                  aria-label={`${room.name} 입장`}
                >
                  입장하기
                </button>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
  return (
    <div className="study-room-list">
      <div className="page-intro">
        <span className="eyebrow">OUR STUDY ROOMS</span>
        <h1>함께 집중할 나만의 공간</h1>
        <p>
          최대 6명이 사용하는 공간의 한 명 로컬 데모입니다. 실제 초대 전송·동시
          접속은 아직 지원하지 않아요.
        </p>
      </div>
      <div className="room-forms">
        <form onSubmit={create}>
          <h2>
            <Plus /> 스터디룸 만들기
          </h2>
          <label htmlFor="room-name">방 이름</label>
          <input
            id="room-name"
            maxLength={30}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 밍구의 회사"
          />
          <p className="muted">회사 테마 · 최대 6석</p>
          <button className="primary" type="submit">
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
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="6자리 초대 코드"
          />
          <p className="muted">예시 초대 코드: MOYEO6</p>
          <button className="primary" type="submit">
            코드로 입장하기
          </button>
        </form>
      </div>
      {error && (
        <p className="room-error" role="alert">
          {error}
        </p>
      )}
      {storageWarning && (
        <p className="room-error" role="status">
          {storageWarning}
        </p>
      )}
      {created && (
        <div className="room-created" role="status">
          <span>
            ‘{created.name}’ 방을 만들었어요. 초대 코드:{" "}
            <strong>{created.code}</strong>
          </span>
          <button className="primary" onClick={() => onEnter(created)}>
            만든 방 입장하기
          </button>
        </div>
      )}
      {section("내가 만든 방 목록", "owned")}
      {section("초대받은 방 목록", "invited")}
    </div>
  );
}
