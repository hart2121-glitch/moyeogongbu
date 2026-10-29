import { Check } from "@phosphor-icons/react";
import { useAppState } from "../viewmodel/AppStateContext";

export default function Toast() {
  const { toast } = useAppState().toast;
  if (!toast) return null;
  return (
    <div className="toast" role="status">
      <Check />
      {toast}
    </div>
  );
}
