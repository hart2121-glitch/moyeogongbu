import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSession } from "../../account/viewmodel/SessionContext";
import { coinKey } from "../../coins/viewmodel/useCoins";
import { toggleTask, type Task } from "../model/tasks";
import { todoErrorMessage } from "../model/todos";
import { todoStore } from "../model/todoStore";

/** 한 날짜의 할 일 쿼리 키. */
export const todosKey = (userId: string | undefined, day: string) => ["todos", userId, day] as const;
/** 기록 화면 쿼리의 공통 앞부분. 할 일이나 코인이 바뀌면 무효화한다. */
export const recordsKeyPrefix = (userId: string | undefined) => ["records", userId] as const;

/**
 * 한 공부 날짜의 할 일 목록과 완료, 추가(오늘만), 삭제 (서버 `todos` 표).
 * 완료하거나 지우면 서버가 코인을 주거나 회수하므로 코인 숫자와 기록도 새로 고친다.
 * @example const { tasks, toggle, add, remove } = useDayTodos("2026-10-30");
 */
export function useDayTodos(day: string) {
  const queryClient = useQueryClient();
  const userId = useSession()?.user.id;
  const key = todosKey(userId, day);
  const query = useQuery({
    queryKey: key,
    queryFn: () => todoStore.list(day),
    enabled: !!userId,
  });
  const [error, setError] = useState("");
  // 누른 체크 표시를 같은 렌더에서 바로 보여 준다. 쿼리 캐시 알림은 다음 틱으로 미뤄져
  // 그 사이 제어된 체크박스가 이전 값으로 돌아가기 때문이다. 서버 응답 뒤에는 지운다.
  const [pendingDone, setPendingDone] = useState<Record<number, boolean>>({});
  const refreshSideEffects = () => {
    void queryClient.invalidateQueries({ queryKey: coinKey(userId) });
    void queryClient.invalidateQueries({ queryKey: recordsKeyPrefix(userId) });
  };
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    refreshSideEffects();
  };
  const toggleMutation = useMutation({
    mutationFn: (task: Task) => todoStore.setDone(task.id, !task.done),
    onSettled: (_data, _error, task) => {
      setPendingDone(({ [task.id]: _, ...rest }) => rest);
      refresh();
    },
  });
  const addMutation = useMutation({
    mutationFn: (text: string) => todoStore.add(text),
    // 서버가 돌려준 행을 바로 붙인다. 성공 뒤에 목록을 다시 부르면, 그 사이 누른 체크 표시를
    // 저장 전 서버 값으로 덮어쓸 수 있어 실패했을 때만 다시 부른다.
    onSuccess: (task) => {
      setError("");
      queryClient.setQueryData<Task[]>(key, (old) => [...(old ?? []), task]);
    },
    onError: (e) => {
      setError(todoErrorMessage(e));
      refresh();
    },
  });
  const removeMutation = useMutation({
    mutationFn: (id: number) => todoStore.remove(id),
    // 지운 행은 바로 뺀다. 추가와 같은 이유로 성공하면 목록은 다시 부르지 않는다.
    onMutate: (id) => queryClient.setQueryData<Task[]>(key, (old) => (old ?? []).filter((t) => t.id !== id)),
    onSuccess: refreshSideEffects,
    onError: (e) => {
      setError(todoErrorMessage(e));
      refresh();
    },
  });
  const tasks = (query.data ?? []).map((t) =>
    t.id in pendingDone ? { ...t, done: pendingDone[t.id] } : t,
  );
  const toggle = (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    // 체크 표시는 누르는 즉시 바꾸고 (낙관적 갱신), 실패하면 onSettled가 서버 값으로 되돌린다.
    // 진행 중인 목록 다시 불러오기(예: 방금 추가한 할 일)가 이 표시를 덮어쓰지 않게 먼저 취소한다.
    // 취소가 나중에 이전 데이터로 되돌리면 방금 바꾼 표시가 지워지므로 되돌리지 않는다.
    void queryClient.cancelQueries({ queryKey: key }, { revert: false });
    setPendingDone((p) => ({ ...p, [id]: !task.done }));
    queryClient.setQueryData<Task[]>(key, (old) => toggleTask(old ?? [], id));
    toggleMutation.mutate(task);
  };
  return {
    tasks,
    loaded: query.isSuccess,
    error,
    toggle,
    /** 오늘 목록에 추가한다 (날짜는 서버가 오늘로 정한다). */
    add: (text: string) => addMutation.mutate(text),
    remove: (id: number) => removeMutation.mutate(id),
  };
}

/**
 * 지난 날짜의 미완료 할 일을 오늘로 옮긴다. 성공하면 모든 날짜의 할 일과 기록을 새로 부른다.
 * @example const move = useMoveToToday(); await move.mutateAsync([3]);
 */
export function useMoveToToday() {
  const queryClient = useQueryClient();
  const userId = useSession()?.user.id;
  return useMutation({
    mutationFn: (ids: readonly number[]) => todoStore.carryOver(ids),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["todos", userId] });
      void queryClient.invalidateQueries({ queryKey: recordsKeyPrefix(userId) });
    },
  });
}
