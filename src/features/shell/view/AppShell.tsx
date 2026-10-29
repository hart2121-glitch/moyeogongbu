import { Outlet } from "react-router-dom";
import AppStateProvider from "../viewmodel/AppStateProvider";
import ModalHost from "./ModalHost";
import Sidebar from "./Sidebar";
import Toast from "./Toast";
import TopBar from "./TopBar";

/**
 * 모든 화면의 공통 틀(상단 바, 사이드바, 토스트, 모달).
 * 라우터의 레이아웃 라우트로 쓰며, 화면별 내용은 Outlet에 들어간다.
 */
export default function AppShell() {
  return (
    <AppStateProvider>
      <div className="app">
        <TopBar />
        <div className="layout">
          <Sidebar />
          <main className="scene">
            <div className="scene-shade" />
            <Outlet />
          </main>
        </div>
        <Toast />
        <ModalHost />
      </div>
    </AppStateProvider>
  );
}
