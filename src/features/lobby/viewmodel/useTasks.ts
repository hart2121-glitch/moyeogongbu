import { useState } from "react";
import { todayKey } from "../../todos/model/studyDay";
import { createTask } from "../../todos/model/tasks";
import { TODO_CONFIG } from "../../todos/model/todoConfig";
import { useDayTodos } from "../../todos/viewmodel/useDayTodos";

/**
 * 로비의 오늘의 할 일 목록과 추가 입력 상태 (서버 `todos` 표, 오늘 날짜).
 * 목록, 완료, 삭제는 `useDayTodos`가 하고 여기서는 추가 입력과 하루 개수 제한만 더한다.
 * @example const { tasks, toggle, submit } = useTasks();
 */
export function useTasks() {
  const todos = useDayTodos(todayKey());
  const [taskInput, setTaskInput] = useState("");
  const limitReached = todos.tasks.length >= TODO_CONFIG.dailyMax;
  /** 입력을 새 할 일로 보낸다. 보냈으면 true, 빈 입력이거나 하루 개수가 찼으면 false. */
  const submit = () => {
    if (limitReached) return false;
    const task = createTask(taskInput, 0);
    if (!task) return false;
    todos.add(task.text);
    setTaskInput("");
    return true;
  };
  return {
    tasks: todos.tasks,
    taskInput,
    setTaskInput,
    toggle: todos.toggle,
    remove: todos.remove,
    submit,
    limitReached,
    error: todos.error,
  };
}
