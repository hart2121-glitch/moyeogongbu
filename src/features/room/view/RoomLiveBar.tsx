import { useEffect, useState, type FormEvent } from "react";
import { REACTIONS, ROOM_CONFIG } from "../model/roomConfig";
import { useCurrentTask } from "../viewmodel/useCurrentTask";

interface Props {
  connected: boolean;
  sendReaction: (key: string) => boolean;
  /** 지금 하는 일을 저장한 뒤 같은 방 사람들에게 알린다. */
  onTaskSaved: () => void;
}

/** 방 툴바 아래 줄: 정해진 반응 버튼과 "지금 하는 일". 자유 채팅은 없다. */
export default function RoomLiveBar({ connected, sendReaction, onTaskSaved }: Props) {
  const current = useCurrentTask();
  const [task, setTask] = useState("");
  const [shared, setShared] = useState(false);
  const [note, setNote] = useState("");
  useEffect(() => {
    if (!current.loaded) return;
    setTask(current.task);
    setShared(current.shared);
  }, [current.loaded, current.task, current.shared]);

  const react = (key: string) => {
    setNote(sendReaction(key) ? "" : "반응은 5초에 한 번 보낼 수 있어요.");
  };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await current.save(task, shared);
      setNote("지금 하는 일을 저장했어요.");
      onTaskSaved();
    } catch (error) {
      setNote(error instanceof Error ? error.message : "저장하지 못했어요.");
    }
  };

  return (
    <div className="room-live-bar" data-testid="room-live-bar">
      <div className="room-reactions" role="group" aria-label="반응 보내기">
        {REACTIONS.map((r) => (
          <button key={r.key} type="button" onClick={() => react(r.key)} disabled={!connected} aria-label={`반응 ${r.label}`}>
            {r.label}
          </button>
        ))}
      </div>
      <form className="room-task" onSubmit={save}>
        <label htmlFor="current-task">지금 하는 일</label>
        <input
          id="current-task"
          maxLength={ROOM_CONFIG.taskMaxLength}
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="예: 영어 단어 외우기"
        />
        <label className="room-task-share">
          <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} /> 공개
        </label>
        <button type="submit">저장</button>
      </form>
      {!connected && <p className="room-connection">연결이 끊겼어요. 다시 연결하는 동안 공부 시간 측정을 멈춰요.</p>}
      {note && <p className="muted room-live-note">{note}</p>}
    </div>
  );
}
