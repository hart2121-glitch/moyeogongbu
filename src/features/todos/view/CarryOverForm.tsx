import { useState } from "react";
import { addDays, todayKey } from "../model/studyDay";
import { todoErrorMessage } from "../model/todos";
import { useDayTodos, useMoveToToday } from "../viewmodel/useDayTodos";

/**
 * 어제의 미완료 할 일 가져오기 (모달 내용). 고른 것만 오늘로 옮기고, 나머지는 어제에 남는다.
 * @example <CarryOverForm onDone={closeModal} />
 */
export default function CarryOverForm({ onDone }: { onDone: () => void }) {
  const yesterday = addDays(todayKey(), -1);
  const undone = useDayTodos(yesterday).tasks.filter((t) => !t.done);
  const move = useMoveToToday();
  const [picked, setPicked] = useState<Record<number, boolean>>({});
  const [error, setError] = useState("");
  const pickedIds = undone.filter((t) => picked[t.id]).map((t) => t.id);
  const bring = async (ids: number[]) => {
    try {
      await move.mutateAsync(ids);
      onDone();
    } catch (e) {
      setError(todoErrorMessage(e));
    }
  };
  if (undone.length === 0) return <p>어제 남은 할 일이 없어요.</p>;
  return (
    <div className="carry-over">
      <p>어제 끝내지 못한 할 일이 있어요. 오늘로 가져올까요?</p>
      <p className="muted">가져오지 않은 할 일은 어제 기록에 그대로 남아요.</p>
      <ul className="carry-list">
        {undone.map((t) => (
          <li key={t.id}>
            <label className="check-row">
              <input
                type="checkbox"
                checked={!!picked[t.id]}
                onChange={(e) => setPicked((p) => ({ ...p, [t.id]: e.target.checked }))}
              />
              <span>{t.text}</span>
            </label>
          </li>
        ))}
      </ul>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="settings-actions">
        <button className="primary" disabled={move.isPending} onClick={() => bring(undone.map((t) => t.id))}>
          모두 가져오기
        </button>
        <button className="secondary-button" disabled={move.isPending || pickedIds.length === 0} onClick={() => bring(pickedIds)}>
          골라서 가져오기
        </button>
      </div>
    </div>
  );
}
