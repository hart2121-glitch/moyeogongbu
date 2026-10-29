export interface Task {
  id: number;
  text: string;
  done: boolean;
}

/** 할 일 입력 최대 글자 수. */
export const MAX_TASK_LENGTH = 40;

/** 처음 접속할 때 보이는 예시 할 일. */
export const INITIAL_TASKS: readonly Task[] = [
  { id: 1, text: "자소서 쓰기", done: true },
  { id: 2, text: "포트폴리오 정리", done: true },
  { id: 3, text: "면접 후기 정리", done: false },
  { id: 4, text: "운동하기", done: false },
  { id: 5, text: "방 청소하기", done: false },
];

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
