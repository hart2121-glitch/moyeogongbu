import { createContext, useContext } from "react";
import type { useTasks } from "../../lobby/viewmodel/useTasks";
import type { useTip } from "../../lobby/viewmodel/useTip";
import type { useModal } from "./useModal";
import type { useToast } from "./useToast";

/** 화면 사이에서 유지되는 앱 상태. 값은 모두 메모리에만 있다. */
export interface AppState {
  modal: ReturnType<typeof useModal>;
  toast: ReturnType<typeof useToast>;
  tasks: ReturnType<typeof useTasks>;
  tip: ReturnType<typeof useTip>;
}

export const AppStateContext = createContext<AppState | null>(null);

/**
 * 앱 상태를 읽는 ViewModel 훅. `AppStateProvider` 안에서만 쓴다.
 * @example const { modal, toast } = useAppState();
 */
export function useAppState(): AppState {
  const state = useContext(AppStateContext);
  if (!state) throw new Error("AppStateProvider 안에서만 사용할 수 있어요.");
  return state;
}
