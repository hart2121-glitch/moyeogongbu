import { MAX_TASK_LENGTH } from "../model/tasks";
import { TODO_CONFIG } from "../../todos/model/todoConfig";
import { useAppState } from "../../shell/viewmodel/AppStateContext";

/** 오늘의 할 일 추가 모달 내용. 하루 개수가 차면 추가를 막는다. */
export default function TaskForm() {
  const { tasks, modal } = useAppState();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (tasks.submit()) modal.closeModal();
      }}
    >
      <label htmlFor="task">오늘 하고 싶은 일</label>
      <input
        id="task"
        maxLength={MAX_TASK_LENGTH}
        required
        disabled={tasks.limitReached}
        value={tasks.taskInput}
        onChange={(e) => tasks.setTaskInput(e.target.value)}
        placeholder="작은 목표를 적어 주세요"
      />
      {tasks.limitReached && (
        <p className="muted">하루에 할 일은 {TODO_CONFIG.dailyMax}개까지 둘 수 있어요.</p>
      )}
      <button className="primary" disabled={tasks.limitReached}>
        추가하기
      </button>
    </form>
  );
}
