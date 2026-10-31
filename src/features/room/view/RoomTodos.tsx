import { Plus } from "@phosphor-icons/react";
import { useAppState } from "../../shell/viewmodel/AppStateContext";

/**
 * 회사 방 오른쪽 열의 오늘의 할 일 (로비 메모지와 같은 목록). 방 그림에 그려져 있던 가짜 할 일 대신 실제 할 일을 보여 준다.
 * @example <CompanyRoom side={<RoomTodos />} />
 */
export default function RoomTodos() {
  const { tasks, modal } = useAppState();
  return (
    <section className="room-todos" aria-labelledby="room-todos-title">
      <h2 id="room-todos-title">오늘의 할 일</h2>
      {tasks.tasks.length === 0 ? (
        <p className="room-todos-empty">적어 둔 할 일이 없어요. 하나 적어 두면 아래에서 "지금 하는 일"로 고를 수 있어요.</p>
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
      <button className="room-todos-add" onClick={() => modal.openModal("task")}>
        <Plus /> 할 일 추가
      </button>
    </section>
  );
}
