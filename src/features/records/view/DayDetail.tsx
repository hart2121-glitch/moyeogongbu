import { useState, type FormEvent } from "react";
import { TODO_CONFIG } from "../../todos/model/todoConfig";
import { todayKey } from "../../todos/model/studyDay";
import { todoErrorMessage } from "../../todos/model/todos";
import { useDayTodos, useMoveToToday } from "../../todos/viewmodel/useDayTodos";
import { formatDuration } from "../model/records";
import { useRecordDay } from "../viewmodel/useRecords";

/**
 * 날짜 상세 (모달 내용): 공부 시간, 받은 코인, 완료한 할 일, 남은 할 일.
 * 남은 할 일은 완료하거나 지울 수 있고, 지난 날짜면 오늘로 옮길 수 있다. 오늘이면 새로 추가할 수 있다.
 * @example <DayDetail day="2026-10-29" />
 */
export default function DayDetail({ day }: { day: string }) {
  const isToday = day === todayKey();
  const detail = useRecordDay(day);
  const todos = useDayTodos(day);
  const move = useMoveToToday();
  const [input, setInput] = useState("");
  const [note, setNote] = useState("");
  const undone = todos.tasks.filter((t) => !t.done);
  const full = isToday && todos.tasks.length >= TODO_CONFIG.dailyMax;

  const moveToToday = async (id: number) => {
    try {
      await move.mutateAsync([id]);
      setNote("오늘의 할 일로 옮겼어요.");
    } catch (e) {
      setNote(todoErrorMessage(e));
    }
  };
  const add = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || full) return;
    todos.add(text);
    setInput("");
  };

  if (detail.isError) return <p role="alert">기록을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>;
  const d = detail.data;
  return (
    <div className="day-detail" data-testid="day-detail">
      <dl className="settlement-list">
        <div className="settlement-row">
          <dt>공부 시간</dt>
          <dd>{d ? formatDuration(d.studySeconds) : "불러오는 중"}</dd>
        </div>
        <div className="settlement-row">
          <dt>공부 코인</dt>
          <dd>{d?.coins.study ?? 0}</dd>
        </div>
        <div className="settlement-row">
          <dt>뽀모도로 보너스</dt>
          <dd>{d?.coins.pomodoro ?? 0}</dd>
        </div>
        <div className="settlement-row">
          <dt>할 일 코인</dt>
          <dd>{d?.coins.todo ?? 0}</dd>
        </div>
        <div className="settlement-row settlement-sum">
          <dt>받은 코인</dt>
          <dd>{d?.total ?? 0}</dd>
        </div>
      </dl>

      <h3 className="day-detail-heading">완료한 할 일</h3>
      {d && d.todosDone.length > 0 ? (
        <ul className="day-done-list">
          {d.todosDone.map((text, i) => (
            <li key={i}>{text}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">완료한 할 일이 없어요.</p>
      )}

      <h3 className="day-detail-heading">{isToday ? "남은 오늘의 할 일" : "남은 할 일"}</h3>
      {undone.length > 0 ? (
        <ul className="day-todo-list">
          {undone.map((t) => (
            <li key={t.id}>
              <label className="check-row">
                <input type="checkbox" checked={t.done} onChange={() => todos.toggle(t.id)} />
                <span>{t.text}</span>
              </label>
              <span className="day-todo-actions">
                {!isToday && (
                  <button
                    type="button"
                    className="text-button"
                    disabled={move.isPending}
                    onClick={() => moveToToday(t.id)}
                  >
                    오늘로 옮기기
                  </button>
                )}
                <button
                  type="button"
                  className="text-button"
                  aria-label={`${t.text} 지우기`}
                  onClick={() => todos.remove(t.id)}
                >
                  지우기
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{todos.loaded ? "남은 할 일이 없어요." : "불러오는 중이에요."}</p>
      )}

      {isToday && (
        <form className="day-todo-add" onSubmit={add}>
          <label htmlFor="day-todo-input">할 일 추가</label>
          <input
            id="day-todo-input"
            maxLength={TODO_CONFIG.textMaxLength}
            value={input}
            disabled={full}
            onChange={(e) => setInput(e.target.value)}
            placeholder="작은 목표를 적어 주세요"
          />
          <button className="primary" disabled={full || !input.trim()}>
            추가하기
          </button>
          {full && <p className="muted">하루에 할 일은 {TODO_CONFIG.dailyMax}개까지 둘 수 있어요.</p>}
        </form>
      )}
      {(note || todos.error) && (
        <p className="muted" role="status">
          {note || todos.error}
        </p>
      )}
    </div>
  );
}
