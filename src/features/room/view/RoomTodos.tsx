import TaskList from "../../lobby/view/TaskList";

/**
 * 회사 방 오른쪽 열의 오늘의 할 일 (로비 메모지와 같은 목록). 방 그림에 그려져 있던 가짜 할 일 대신 실제 할 일을 보여 준다.
 * @example <CompanyRoom side={<RoomTodos />} />
 */
export default function RoomTodos() {
  return (
    <section className="room-todos" aria-labelledby="room-todos-title">
      <h2 id="room-todos-title">오늘의 할 일</h2>
      <TaskList empty="적어 둔 할 일이 없어요." addClassName="room-todos-add" />
    </section>
  );
}
