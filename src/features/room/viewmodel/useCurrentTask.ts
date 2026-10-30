import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "../../account/viewmodel/SessionContext";
import { roomStore } from "../model/roomStore";

/**
 * 내 "지금 하는 일"과 공개 여부.
 * @example const { task, shared, save } = useCurrentTask(); await save("영어 단어", true);
 */
export function useCurrentTask() {
  const queryClient = useQueryClient();
  const userId = useSession()?.user.id;
  const key = ["current-task", userId] as const;
  const query = useQuery({ queryKey: key, queryFn: roomStore.currentTask, enabled: !!userId });
  return {
    task: query.data?.task ?? "",
    shared: query.data?.shared ?? false,
    loaded: query.isSuccess,
    save: async (task: string, shared: boolean) => {
      const saved = await roomStore.saveCurrentTask(task, shared);
      queryClient.setQueryData(key, saved);
      return saved;
    },
  };
}
