import { createBrowserRouter, Navigate } from "react-router-dom";
import CharacterPage from "../features/character/view/CharacterPage";
import FriendsPage from "../features/friends/view/FriendsPage";
import GuidePage from "../features/guide/view/GuidePage";
import LobbyPage from "../features/lobby/view/LobbyPage";
import RecordsPage from "../features/records/view/RecordsPage";
import CafePage from "../features/rooms/view/CafePage";
import CompanyRoomPage from "../features/rooms/view/CompanyRoomPage";
import RoomListPage from "../features/rooms/view/RoomListPage";
import ThemeRoomPage from "../features/rooms/view/ThemeRoomPage";
import { ROUTES, THEME_ROOM_BASE } from "../features/shell/model/paths";
import AppShell from "../features/shell/view/AppShell";
import ShopPage from "../features/shop/view/ShopPage";

const toLobby = <Navigate to={ROUTES.lobby} replace />;

/**
 * 주소와 화면의 대응표. `/`와 알 수 없는 주소는 로비로 보낸다.
 * 새로고침해도 같은 주소의 화면이 열린다(개발 서버와 배포 모두 index.html로 되돌려 준다).
 */
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: toLobby },
      { path: ROUTES.lobby, element: <LobbyPage /> },
      { path: ROUTES.rooms, element: <RoomListPage /> },
      { path: `${ROUTES.rooms}/:code`, element: <CompanyRoomPage /> },
      { path: `${THEME_ROOM_BASE}/:theme`, element: <ThemeRoomPage /> },
      { path: ROUTES.cafe, element: <CafePage /> },
      { path: ROUTES.character, element: <CharacterPage /> },
      { path: ROUTES.shop, element: <ShopPage /> },
      { path: ROUTES.records, element: <RecordsPage /> },
      { path: ROUTES.friends, element: <FriendsPage /> },
      { path: ROUTES.guide, element: <GuidePage /> },
      { path: "*", element: toLobby },
    ],
  },
]);
