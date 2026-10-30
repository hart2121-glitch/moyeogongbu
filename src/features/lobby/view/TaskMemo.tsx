import { Plus } from "@phosphor-icons/react";
import { useEffect } from "react";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { useCarryOverPrompt } from "../../todos/viewmodel/useCarryOver";
import DeskObject, { type LookHandler } from "./DeskObject";

/** 메모지: 오늘의 할 일. 새 날 처음 볼 때 어제의 미완료 할 일을 한 번 제안한다 (Story 005). */
export default function TaskMemo({ onLook }: { onLook: LookHandler }) {
  const { tasks, modal } = useAppState();
  const carry = useCarryOverPrompt();
  const busy = modal.modal !== null;
  useEffect(() => {
    if (!carry.shouldAsk || busy) return;
    carry.markAsked();
    modal.openModal("carry");
  }, [carry.shouldAsk, busy]);
  return (
    <DeskObject
      kind="memo"
      title="오늘의 할 일"
      onLook={onLook}
      footer={
        <button className="memo-add" onClick={() => modal.openModal("task")}>
          <Plus /> 할 일 추가
        </button>
      }
    >
      {tasks.tasks.length === 0 ? (
        <p className="desk-empty">오늘 할 일을 하나 적어 두면 방에서 "지금 하는 일"로 고를 수 있어요.</p>
      ) : (
        <ul className="task-list">
          {tasks.tasks.map((task) => (
            <li key={task.id}>
              <label>
                <input type="checkbox" checked={task.done} onChange={() => tasks.toggle(task.id)} />
                <span>{task.text}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </DeskObject>
  );
}
