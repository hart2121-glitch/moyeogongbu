import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSession } from "../../account/viewmodel/SessionContext";
import { coinKey } from "../../coins/viewmodel/useCoins";
import { SESSION_CONFIG } from "../../session/model/sessionConfig";
import { dayStartOf } from "../../session/model/sessionMachine";
import { createTask, toggleTask, type Task } from "../model/tasks";
import { todoStore } from "../model/todoStore";

const KST_OFFSET_MS = 9 * 3_600_000;

/** 지금 시각의 공부 날짜 (YYYY-MM-DD, 한국 시간 오전 5시 경계). */
const todayKey = () =>
  new Date(dayStartOf(Date.now(), SESSION_CONFIG) + KST_OFFSET_MS).toISOString().slice(0, 10);

/**
 * 오늘의 할 일 목록과 추가 입력 상태 (Story 003: 서버 `todos` 표).
 * 새 계정은 빈 목록으로 시작한다. 완료하면 서버가 코인을 주므로 코인 숫자도 새로 고친다.
 * @example const { tasks, toggle, submit } = useTasks();
 */
export function useTasks() {
  const queryClient = useQueryClient();
  const userId = useSession()?.user.id;
  const day = todayKey();
  const key = ["todos", userId, day] as const;
  const query = useQuery({
    queryKey: key,
    queryFn: () => todoStore.list(day),
    enabled: !!userId,
  });
  const [taskInput, setTaskInput] = useState("");
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: coinKey(userId) });
  };
  const toggleMutation = useMutation({
    mutationFn: (task: Task) => todoStore.setDone(task.id, !task.done),
    onSettled: refresh,
  });
  const addMutation = useMutation({
    mutationFn: (text: string) => todoStore.add(text),
    onSuccess: (task) => queryClient.setQueryData<Task[]>(key, (old) => [...(old ?? []), task]),
    onSettled: refresh,
  });
  const tasks = query.data ?? [];
  const toggle = (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    // 체크 표시는 누르는 즉시 바꾸고 (낙관적 갱신), 실패하면 onSettled가 서버 값으로 되돌린다.
    queryClient.setQueryData<Task[]>(key, (old) => toggleTask(old ?? [], id));
    toggleMutation.mutate(task);
  };
  /** 입력을 새 할 일로 보낸다. 보냈으면 true, 빈 입력이면 false. */
  const submit = () => {
    const task = createTask(taskInput, 0);
    if (!task) return false;
    addMutation.mutate(task.text);
    setTaskInput("");
    return true;
  };
  return { tasks, taskInput, setTaskInput, toggle, submit };
}
