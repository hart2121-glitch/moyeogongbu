import type { ComponentType } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../features/account/view/LoginPage";
import RequireAccount from "../features/account/view/RequireAccount";
import LobbyPage from "../features/lobby/view/LobbyPage";
import { ROUTES } from "../features/shell/model/paths";
import AppShell from "../features/shell/view/AppShell";

const toLobby = <Navigate to={ROUTES.lobby} replace />;

/** 화면 파일을 처음 열 때 받는다 (첫 화면인 로그인과 내 방만 처음부터 싣는다). */
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default });

/** 나눠 받은 화면을 처음 여는 동안 (새로고침 직후) 비워 둔다. 틀 색만 깔아 깜빡임을 줄인다. */
const loading = <div className="route-loading" aria-busy="true" />;

/**
 * 주소와 화면의 대응표. `/`와 알 수 없는 주소는 로비로 보낸다.
 * 새로고침해도 같은 주소의 화면이 열린다(개발 서버와 배포 모두 index.html로 되돌려 준다).
 * `/login`과 `/privacy`만 로그인 없이 열리고, 나머지는 `RequireAccount`가 막는다.
 * 로그인과 내 방 말고는 화면마다 따로 받아 첫 화면을 가볍게 한다.
 */
export const router = createBrowserRouter([
  { path: ROUTES.login, element: <LoginPage /> },
  { path: ROUTES.privacy, lazy: page(() => import("../features/legal/view/PrivacyPage")), hydrateFallbackElement: loading },
  {
    element: <RequireAccount />,
    hydrateFallbackElement: loading,
    children: [
      { path: ROUTES.welcome, lazy: page(() => import("../features/account/view/WelcomePage")) },
      {
        element: <AppShell />,
        children: [
          { path: "/", element: toLobby },
          { path: ROUTES.lobby, element: <LobbyPage /> },
          { path: ROUTES.rooms, lazy: page(() => import("../features/rooms/view/RoomListPage")) },
          { path: `${ROUTES.rooms}/:roomId`, lazy: page(() => import("../features/rooms/view/CompanyRoomPage")) },
          { path: ROUTES.cafe, lazy: page(() => import("../features/rooms/view/CafePage")) },
          { path: ROUTES.character, lazy: page(() => import("../features/character/view/CharacterPage")) },
          // 상점은 꾸미기에 합쳤다 (2026-11-01). 예전 주소는 꾸미기로 보낸다.
          { path: ROUTES.shop, element: <Navigate to={ROUTES.character} replace /> },
          { path: ROUTES.records, lazy: page(() => import("../features/records/view/RecordsPage")) },
          { path: ROUTES.friends, lazy: page(() => import("../features/friends/view/FriendsPage")) },
          { path: ROUTES.guide, lazy: page(() => import("../features/guide/view/GuidePage")) },
          { path: "*", element: toLobby },
        ],
      },
    ],
  },
]);
