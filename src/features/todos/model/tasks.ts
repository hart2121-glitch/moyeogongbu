import { TODO_CONFIG } from "./todoConfig";

export interface Task {
  id: number;
  text: string;
  done: boolean;
}

/** 할 일 입력 최대 글자 수. DB `todos.text` 검사(1~50자)와 같다. 새 계정은 빈 목록으로 시작한다. */
export const MAX_TASK_LENGTH = TODO_CONFIG.textMaxLength;

/**
 * 입력 글자로 새 할 일을 만든다. 공백뿐이면 null.
 * @example createTask("  운동  ", 7) // { id: 7, text: "운동", done: false }
 */
export function createTask(input: string, id: number): Task | null {
  const text = input.trim();
  return text ? { id, text, done: false } : null;
}

/**
 * 해당 할 일의 완료 상태를 뒤집은 새 목록.
 * @example toggleTask(tasks, 3)
 */
export function toggleTask(tasks: readonly Task[], id: number): Task[] {
  return tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
}

/** 완료한 할 일 수. */
export const countDone = (tasks: readonly Task[]) =>
  tasks.filter((t) => t.done).length;
