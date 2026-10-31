import { useEffect, useState, type FormEvent } from "react";
import { REACTIONS, ROOM_CONFIG } from "../model/roomConfig";
import { useCurrentTask } from "../viewmodel/useCurrentTask";
import { todayKey } from "../../todos/model/studyDay";
import { useDayTodos } from "../../todos/viewmodel/useDayTodos";

interface Props {
  connected: boolean;
  sendReaction: (key: string) => boolean;
  /** 지금 하는 일을 저장한 뒤 같은 방 사람들에게 알린다. */
  onTaskSaved: () => void;
}

/** 방 툴바 아래 줄: 정해진 반응 버튼과 "지금 하는 일". 자유 채팅은 없다. */
export default function RoomLiveBar({ connected, sendReaction, onTaskSaved }: Props) {
  const current = useCurrentTask();
  // 오늘의 미완료 할 일 중 하나를 골라 "지금 하는 일"로 쓸 수 있다 (Story 005). 공개 여부는 그대로 사용자가 정한다.
  const openTodos = useDayTodos(todayKey()).tasks.filter((t) => !t.done);
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
          <button
            key={r.key}
            type="button"
            className={`reaction-${r.kind}`}
            onClick={() => react(r.key)}
            disabled={!connected}
            aria-label={`반응 ${r.name}`}
            title={r.name}
          >
            {r.label}
          </button>
        ))}
      </div>
      <form className="room-task" onSubmit={save}>
        <label htmlFor="current-task">지금 하는 일</label>
        {openTodos.length > 0 && (
          <select
            aria-label="오늘의 할 일에서 고르기"
            value=""
            onChange={(e) => {
              const picked = openTodos.find((t) => String(t.id) === e.target.value);
              if (picked) setTask(picked.text.slice(0, ROOM_CONFIG.taskMaxLength));
            }}
          >
            <option value="">할 일에서 고르기</option>
            {openTodos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.text}
              </option>
            ))}
          </select>
        )}
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
