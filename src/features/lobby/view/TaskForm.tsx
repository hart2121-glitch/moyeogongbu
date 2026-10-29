import { MAX_TASK_LENGTH } from "../model/tasks";
import { useAppState } from "../../shell/viewmodel/AppStateContext";

/** 오늘의 할 일 추가 모달 내용. */
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
        value={tasks.taskInput}
        onChange={(e) => tasks.setTaskInput(e.target.value)}
        placeholder="작은 목표를 적어 주세요"
      />
      <button className="primary">추가하기</button>
    </form>
  );
}
