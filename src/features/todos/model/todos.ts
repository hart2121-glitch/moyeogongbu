import type { SupabaseClient } from "@supabase/supabase-js";
import { TODO_CONFIG } from "./todoConfig";
import type { Task } from "./tasks";

/**
 * 할 일 서버 호출 (Story 003, 005). 표 `todos`는 본인 행만 읽고 쓸 수 있고,
 * 완료하면 DB 트리거가 코인을 주고 완료 취소나 삭제면 회수한다.
 * 하루 개수 제한은 DB 트리거가 막고(`todo_limit`), 날짜 옮기기는 `carry_over_todos` 함수만 한다.
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
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
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

/**
 * 할 일을 지운다. 완료해서 받은 코인은 서버 트리거가 회수한다.
 * @example await deleteTodo(supabase, 3);
 */
export async function deleteTodo(client: SupabaseClient, id: number): Promise<void> {
  const { error } = await client.from("todos").delete().eq("id", id);
  if (error) throw error;
}

/**
 * 지난 날짜의 미완료 할 일을 오늘로 옮긴다. 본인 것, 미완료, 지난 날짜만 옮기고 옮긴 수를 돌려준다.
 * 오늘이 하루 개수를 넘게 되면 하나도 옮기지 않고 `todo_limit` 오류.
 * @example const moved = await carryOverTodos(supabase, [4, 5]);
 */
export async function carryOverTodos(client: SupabaseClient, ids: readonly number[]): Promise<number> {
  const { data, error } = await client.rpc("carry_over_todos", { p_ids: ids });
  if (error) throw error;
  return Number(data) || 0;
}

/**
 * 할 일 오류를 화면 문구로 바꾼다.
 * @example todoErrorMessage({ message: "todo_limit" }) // "하루에 할 일은 30개까지 둘 수 있어요."
 */
export function todoErrorMessage(error: unknown): string {
  const message = (error as { message?: string } | null)?.message ?? "";
  if (message.includes("todo_limit")) return `하루에 할 일은 ${TODO_CONFIG.dailyMax}개까지 둘 수 있어요.`;
  return "할 일을 저장하지 못했어요. 잠시 뒤 다시 해 주세요.";
}
