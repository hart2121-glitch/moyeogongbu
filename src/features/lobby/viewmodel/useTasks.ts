import { useState } from "react";
import {
  createTask,
  INITIAL_TASKS,
  toggleTask,
  type Task,
} from "../model/tasks";

/**
 * 오늘의 할 일 목록과 추가 입력 상태. 값은 메모리에만 유지된다.
 * @example const { tasks, toggle, submit } = useTasks();
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([...INITIAL_TASKS]);
  const [taskInput, setTaskInput] = useState("");
  const toggle = (id: number) => setTasks(toggleTask(tasks, id));
  /** 입력을 새 할 일로 추가한다. 추가했으면 true, 빈 입력이면 false. */
  const submit = () => {
    const task = createTask(taskInput, Date.now());
    if (!task) return false;
    setTasks([...tasks, task]);
    setTaskInput("");
    return true;
  };
  return { tasks, taskInput, setTaskInput, toggle, submit };
}
