import {
  BookOpen,
  ClipboardText,
  Coffee,
  Flower,
  House,
  Tote,
  TShirt,
  Users,
  type Icon,
} from "@phosphor-icons/react";
import { useLocation, useNavigate } from "react-router-dom";
import { MENU_ITEMS, menuState, type MenuIcon } from "../model/menu";

const MENU_ICONS: Record<MenuIcon, Icon> = {
  house: House,
  coffee: Coffee,
  tshirt: TShirt,
  tote: Tote,
  clipboard: ClipboardText,
  users: Users,
  book: BookOpen,
};

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <aside className="sidebar">
      <nav aria-label="주 메뉴">
        {MENU_ITEMS.map(({ label, path, icon }) => {
          const Icon = MENU_ICONS[icon];
          const { active, current } = menuState(pathname, path);
          return (
            <button
              key={label}
              className={`nav-item ${active ? "active" : ""}`}
              aria-current={current ? "page" : undefined}
              onClick={() => navigate(path)}
            >
              <Icon weight="duotone" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <Flower /> 함께라서 더 좋은 공부
      </div>
    </aside>
  );
}
