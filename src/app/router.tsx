import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../features/account/view/LoginPage";
import RequireAccount from "../features/account/view/RequireAccount";
import WelcomePage from "../features/account/view/WelcomePage";
import CharacterPage from "../features/character/view/CharacterPage";
import FriendsPage from "../features/friends/view/FriendsPage";
import GuidePage from "../features/guide/view/GuidePage";
import PrivacyPage from "../features/legal/view/PrivacyPage";
import LobbyPage from "../features/lobby/view/LobbyPage";
import RecordsPage from "../features/records/view/RecordsPage";
import CafePage from "../features/rooms/view/CafePage";
import CompanyRoomPage from "../features/rooms/view/CompanyRoomPage";
import RoomListPage from "../features/rooms/view/RoomListPage";
import ThemeRoomPage from "../features/rooms/view/ThemeRoomPage";
import { ROUTES, THEME_ROOM_BASE } from "../features/shell/model/paths";
import AppShell from "../features/shell/view/AppShell";

const toLobby = <Navigate to={ROUTES.lobby} replace />;

/**
 * 주소와 화면의 대응표. `/`와 알 수 없는 주소는 로비로 보낸다.
 * 새로고침해도 같은 주소의 화면이 열린다(개발 서버와 배포 모두 index.html로 되돌려 준다).
 * `/login`과 `/privacy`만 로그인 없이 열리고, 나머지는 `RequireAccount`가 막는다.
 */
export const router = createBrowserRouter([
  { path: ROUTES.login, element: <LoginPage /> },
  { path: ROUTES.privacy, element: <PrivacyPage /> },
  {
    element: <RequireAccount />,
    children: [
      { path: ROUTES.welcome, element: <WelcomePage /> },
      {
        element: <AppShell />,
        children: [
          { path: "/", element: toLobby },
          { path: ROUTES.lobby, element: <LobbyPage /> },
          { path: ROUTES.rooms, element: <RoomListPage /> },
          { path: `${ROUTES.rooms}/:roomId`, element: <CompanyRoomPage /> },
          { path: `${THEME_ROOM_BASE}/:theme`, element: <ThemeRoomPage /> },
          { path: ROUTES.cafe, element: <CafePage /> },
          { path: ROUTES.character, element: <CharacterPage /> },
          // 상점은 꾸미기에 합쳤다 (2026-11-01). 예전 주소는 꾸미기로 보낸다.
          { path: ROUTES.shop, element: <Navigate to={ROUTES.character} replace /> },
          { path: ROUTES.records, element: <RecordsPage /> },
          { path: ROUTES.friends, element: <FriendsPage /> },
          { path: ROUTES.guide, element: <GuidePage /> },
          { path: "*", element: toLobby },
        ],
      },
    ],
  },
]);
