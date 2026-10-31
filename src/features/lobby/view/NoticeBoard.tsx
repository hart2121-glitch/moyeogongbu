import { CaretRight } from "@phosphor-icons/react";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { useNotices } from "../viewmodel/useNotices";
import DeskObject, { type LookHandler } from "./DeskObject";

/** 코르크판: 최근 공지 네 개를 쪽지로 꽂아 둔다. */
export default function NoticeBoard({ onLook }: { onLook: LookHandler }) {
  const { openModal } = useAppState().modal;
  const notices = useNotices().slice(0, 4);
  return (
    <DeskObject
      kind="board"
      title="공지사항"
      onLook={onLook}
      footer={
        <button className="desk-more" onClick={() => openModal("notices")}>
          지난 공지 모두 보기 <CaretRight />
        </button>
      }
    >
      {notices.length === 0 ? (
        <p className="desk-empty">새 공지가 없어요.</p>
      ) : (
        <div className="notices">
          {notices.map(({ tag, title, body }) => (
            <button key={title} onClick={() => openModal({ type: "notice", tag, title, body })}>
              <span className="tag">{tag}</span>
              <span>{title}</span>
            </button>
          ))}
        </div>
      )}
    </DeskObject>
  );
}
