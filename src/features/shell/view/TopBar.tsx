import { Bell, Cat, Coin, Envelope, GearSix } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../model/paths";
import { useAppState } from "../viewmodel/AppStateContext";
import { useCoinSummary } from "../../coins/viewmodel/useCoins";
import { useInboxCounts } from "../../notifications/viewmodel/useNotifications";

export default function TopBar() {
  const navigate = useNavigate();
  const { modal } = useAppState();
  const balance = useCoinSummary().data?.balance ?? 0;
  const inbox = useInboxCounts().data;
  return (
    <header className="topbar">
      <button
        className="brand"
        onClick={() => navigate(ROUTES.lobby)}
        aria-label="모여공부 로비"
      >
        <Cat weight="duotone" />
        <span>모여공부</span>
      </button>
      <div className="top-actions">
        <span className="wallet">
          <Coin weight="duotone" />
          {balance.toLocaleString()}
        </span>
        <button aria-label={inbox?.mail ? `우편함, 받지 않은 우편 ${inbox.mail}개` : "우편함"} onClick={() => modal.openModal("mail")}>
          <Envelope />
        </button>
        <button
          className="notification"
          aria-label="알림"
          onClick={() => modal.openModal("notifications")}
        >
          <Bell />
          {!!inbox?.notifications && <i />}
        </button>
        <button aria-label="설정" onClick={() => modal.openModal("settings")}>
          <GearSix />
        </button>
      </div>
    </header>
  );
}
