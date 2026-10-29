import type { SupabaseClient } from "@supabase/supabase-js";
import type { Task } from "./tasks";

/**
 * 할 일 서버 호출 (Story 003). 표 `todos`는 본인 행만 읽고 쓸 수 있고,
 * 완료하면 DB 트리거가 코인을 주고 완료 취소나 삭제면 회수한다.
 * 날짜 이동, 하루 30개, 가져오기는 Story 005.
 */

const COLUMNS = "id, text, done";

/**
 * 공부 날짜(YYYY-MM-DD)의 할 일 목록, 만든 순서.
 * @example const tasks = await listTodos(supabase, "2026-10-30");
 */
export async function listTodos(client: SupabaseClient, day: string): Promise<Task[]> {
  const { data, error } = await client
    .from("todos")
    .select(COLUMNS)
    .eq("day", day)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

/**
 * 오늘 할 일을 추가한다. 날짜와 계정은 서버 기본값이 정한다.
 * @example const task = await addTodo(supabase, "운동하기");
 */
export async function addTodo(client: SupabaseClient, text: string): Promise<Task> {
  const { data, error } = await client.from("todos").insert({ text }).select(COLUMNS);
  if (error) throw error;
  return (data as Task[])[0];
}

/**
 * 완료 여부를 바꾼다. 코인 지급과 회수는 서버 트리거가 한다.
 * @example await setTodoDone(supabase, 3, true);
 */
export async function setTodoDone(client: SupabaseClient, id: number, done: boolean): Promise<void> {
  const { error } = await client.from("todos").update({ done }).eq("id", id);
  if (error) throw error;
}
