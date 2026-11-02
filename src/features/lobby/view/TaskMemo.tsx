import { useEffect } from "react";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { useCarryOverPrompt } from "../../todos/viewmodel/useCarryOver";
import DeskObject, { type LookHandler } from "./DeskObject";
import TaskList from "./TaskList";

/** 메모지: 오늘의 할 일. 새 날 처음 볼 때 어제의 미완료 할 일을 한 번 제안한다 (Story 005). */
export default function TaskMemo({ onLook }: { onLook: LookHandler }) {
  const { modal } = useAppState();
  const carry = useCarryOverPrompt();
  const busy = modal.modal !== null;
  useEffect(() => {
    if (!carry.shouldAsk || busy) return;
    carry.markAsked();
    modal.openModal("carry");
  }, [carry.shouldAsk, busy]);
  return (
    <DeskObject kind="memo" title="오늘의 할 일" onLook={onLook}>
      <TaskList empty="적어 둔 할 일이 없어요." addClassName="memo-add" />
    </DeskObject>
  );
}
