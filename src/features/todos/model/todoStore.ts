import { supabase } from "../../../lib/supabase";
import { addTodo, carryOverTodos, deleteTodo, listTodos, setTodoDone } from "./todos";

/**
 * 앱이 쓰는 할 일 저장소. `todos.ts`의 함수에 공유 Supabase 클라이언트를 묶어 둔다.
 * @example const tasks = await todoStore.list(day);
 */
export const todoStore = {
  list: (day: string) => listTodos(supabase, day),
  add: (text: string) => addTodo(supabase, text),
  setDone: (id: number, done: boolean) => setTodoDone(supabase, id, done),
  remove: (id: number) => deleteTodo(supabase, id),
  carryOver: (ids: readonly number[]) => carryOverTodos(supabase, ids),
};
