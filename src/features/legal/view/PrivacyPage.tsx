import { ArrowLeft } from "@phosphor-icons/react";
import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../account/viewmodel/SessionContext";
import { ROUTES } from "../../shell/model/paths";
import Panel from "../../shell/view/Panel";
import {
  PRIVACY_POLICY,
  type PolicyBlock,
  type PolicyInline,
  type PolicyListItem,
} from "../model/privacyPolicy";

function Inline({ content }: { content: PolicyInline[] }) {
  return content.map((part, i) =>
    typeof part === "string" ? (
      <Fragment key={i}>{part}</Fragment>
    ) : (
      <a key={i} href={part.href} target="_blank" rel="noreferrer">
        {part.text}
      </a>
    ),
  );
}

function List({ ordered, items }: { ordered: boolean; items: PolicyListItem[] }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag>
      {items.map((item, i) => (
        <li key={i}>
          <Inline content={item.content} />
          {item.children && <List ordered={false} items={item.children} />}
        </li>
      ))}
    </Tag>
  );
}

function Blocks({ blocks }: { blocks: PolicyBlock[] }) {
  return blocks.map((block, i) =>
    block.type === "p" ? (
      <p key={i}>
        <Inline content={block.content} />
      </p>
    ) : (
      <List key={i} ordered={block.type === "ol"} items={block.items} />
    ),
  );
}

/** 개인정보 처리방침 화면. 로그인 없이 열리고, 로그인 상태에 따라 로비나 로그인으로 돌아간다. */
export default function PrivacyPage() {
  const navigate = useNavigate();
  const signedIn = !!useSession();
  return (
    <main className="page-area privacy">
      <button
        className="back-button"
        onClick={() => navigate(signedIn ? ROUTES.lobby : ROUTES.login)}
      >
        <ArrowLeft /> {signedIn ? "로비로 돌아가기" : "로그인으로 돌아가기"}
      </button>
      <Panel title={PRIVACY_POLICY.title} className="content-panel">
        <Blocks blocks={PRIVACY_POLICY.intro} />
        {PRIVACY_POLICY.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <Blocks blocks={section.blocks} />
          </section>
        ))}
      </Panel>
    </main>
  );
}
