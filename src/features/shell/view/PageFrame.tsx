import type { ReactNode } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../model/paths";
import Panel from "./Panel";
import "./pageFrame.css";

/**
 * 로비가 아닌 화면의 공통 틀: 로비로 돌아가기 버튼과 제목 패널. 집, 책상 위 스프링 노트로 그린다 (pageFrame.css).
 * @example <PageFrame title="상점">...</PageFrame>
 */
export default function PageFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="page-area">
      <button className="back-button" onClick={() => navigate(ROUTES.lobby)}>
        <ArrowLeft /> 로비로 돌아가기
      </button>
      <Panel title={title} className="content-panel">
        {children}
      </Panel>
    </div>
  );
}
