import { Bell, Cat, Coin, Envelope, GearSix } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../model/paths";
import { useAppState } from "../viewmodel/AppStateContext";

export default function TopBar() {
  const navigate = useNavigate();
  const { shop, modal } = useAppState();
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
          {shop.coins.toLocaleString()}
        </span>
        <button aria-label="우편함" onClick={() => modal.openModal("mail")}>
          <Envelope />
        </button>
        <button
          className="notification"
          aria-label="알림"
          onClick={() => modal.openModal("notifications")}
        >
          <Bell />
          <i />
        </button>
        <button aria-label="설정" onClick={() => modal.openModal("settings")}>
          <GearSix />
        </button>
      </div>
    </header>
  );
}
