import type { ReactNode } from "react";
import { useTasks } from "../../lobby/viewmodel/useTasks";
import { useTip } from "../../lobby/viewmodel/useTip";
import { AppStateContext } from "./AppStateContext";
import { useModal } from "./useModal";
import { useToast } from "./useToast";

/**
 * 기능별 ViewModel 훅을 한곳에서 묶어 모든 화면에 내려 준다.
 * 화면을 오가도 상태가 유지되도록 라우터의 레이아웃 안에 둔다.
 */
export default function AppStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const modal = useModal();
  const toast = useToast();
  const tasks = useTasks();
  const tip = useTip();
  return (
    <AppStateContext.Provider
      value={{ modal, toast, tasks, tip }}
    >
      {children}
    </AppStateContext.Provider>
  );
}
