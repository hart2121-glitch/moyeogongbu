import { Check, Plus } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { MAX_TASK_LENGTH } from "../model/tasks";
import { TODO_CONFIG } from "../../todos/model/todoConfig";
import { useAppState } from "../../shell/viewmodel/AppStateContext";

/**
 * 오늘의 할 일 목록 (로비 메모지와 회사 방 오른쪽 열이 같이 쓴다). 완료한 할 일은 취소선을 긋는다.
 * "할 일 추가"를 누르면 창 대신 목록 끝에 입력 줄이 생기고, Enter로 넣으면 입력 줄이 비워진 채 남아 바로 다음 할 일을 쓴다
 * (2026-11-02 사용자 결정). Esc를 누르거나 빈 채로 밖을 누르면 입력 줄을 닫고, 글자가 있으면 넣고 닫는다.
 * @example <TaskList empty="오늘 할 일을 하나 적어 두세요." addClassName="memo-add" />
 */
export default function TaskList({ empty, addClassName }: { empty: string; addClassName: string }) {
  const { tasks } = useAppState();
  const [adding, setAdding] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (adding) input.current?.focus();
  }, [adding]);
  const close = () => {
    tasks.setTaskInput("");
    setAdding(false);
  };
  return (
    <>
      {tasks.tasks.length === 0 && !adding ? (
        <p className="desk-empty">{empty}</p>
      ) : (
        <ul className="task-list">
          {tasks.tasks.map((task) => (
            <li key={task.id} className={task.done ? "done" : undefined}>
              <label>
                <input type="checkbox" checked={task.done} onChange={() => tasks.toggle(task.id)} />
                <span>{task.text}</span>
              </label>
            </li>
          ))}
          {adding && (
            <li className="task-add-row">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  tasks.submit();
                }}
              >
                <input
                  ref={input}
                  aria-label="오늘 하고 싶은 일"
                  maxLength={MAX_TASK_LENGTH}
                  disabled={tasks.limitReached}
                  value={tasks.taskInput}
                  onChange={(e) => tasks.setTaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && close()}
                  onBlur={(e) => {
                    // 추가 단추를 누르러 가는 중이면 닫지 않는다
                    if (e.relatedTarget?.closest(".task-add-row")) return;
                    if (tasks.taskInput.trim()) tasks.submit();
                    setAdding(false);
                  }}
                  placeholder="작은 목표를 적어 주세요"
                />
                <button type="submit" aria-label="추가하기" title="추가하기" disabled={tasks.limitReached}>
                  <Check weight="bold" />
                </button>
              </form>
              {tasks.limitReached && <p className="muted">하루에 할 일은 {TODO_CONFIG.dailyMax}개까지 둘 수 있어요.</p>}
            </li>
          )}
        </ul>
      )}
      {!adding && (
        <button className={addClassName} onClick={() => setAdding(true)}>
          <Plus /> 할 일 추가
        </button>
      )}
    </>
  );
}
