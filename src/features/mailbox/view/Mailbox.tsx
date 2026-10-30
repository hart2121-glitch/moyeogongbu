import { Envelope } from "@phosphor-icons/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { roomPath } from "../../shell/model/paths";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { mailTitle, remainingText, type Mail } from "../model/mail";
import { useMailbox } from "../viewmodel/useMailbox";

/** 우편함 모달 내용: 친구 요청 수락, 거절, 차단 / 방 초대 입장 / 보상 받기. */
export default function Mailbox() {
  const box = useMailbox();
  const navigate = useNavigate();
  const { closeModal } = useAppState().modal;
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const run = async (mail: Mail, work: () => Promise<string | void>) => {
    setBusy(mail.id);
    setNote("");
    try {
      const text = await work();
      if (text) setNote(text);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "처리하지 못했어요.");
    } finally {
      setBusy(null);
    }
  };
  if (box.loading) return <p className="muted">우편함을 불러오는 중이에요.</p>;
  if (box.failed) return <p role="alert">우편함을 불러오지 못했어요.</p>;
  if (box.mail.length === 0)
    return (
      <div className="empty-state">
        <Envelope />
        <h2>도착한 편지가 없어요</h2>
        <p>오늘도 나만의 속도로 공부해 보세요.</p>
      </div>
    );
  return (
    <div className="mail-list" data-testid="mailbox">
      {note && <p role="status">{note}</p>}
      {box.mail.map((mail) => (
        <article key={mail.id} className={`mail-item mail-${mail.kind}`}>
          <h2>{mailTitle(mail)}</h2>
          <p className="muted">{remainingText(mail.daysLeft)}</p>
          <div className="mail-actions">
            {mail.kind === "friend_request" && mail.senderId && (
              <>
                <button className="primary" disabled={busy === mail.id}
                  onClick={() => run(mail, async () => { await box.respond(mail.senderId!, "accept"); return "친구가 되었어요."; })}>
                  수락
                </button>
                <button className="primary" disabled={busy === mail.id}
                  onClick={() => run(mail, () => box.respond(mail.senderId!, "reject"))}>
                  거절
                </button>
                <button className="primary danger" disabled={busy === mail.id}
                  onClick={() => run(mail, async () => { await box.respond(mail.senderId!, "block"); return "차단했어요. 설정에서 풀 수 있어요."; })}>
                  차단
                </button>
              </>
            )}
            {mail.kind === "room_invite" && (
              <>
                <button className="primary" disabled={busy === mail.id}
                  onClick={() => run(mail, async () => {
                    const roomId = await box.enterRoom(mail.id);
                    closeModal();
                    navigate(roomPath(roomId));
                  })}>
                  바로 입장
                </button>
                <button className="primary" disabled={busy === mail.id} onClick={() => run(mail, () => box.remove(mail.id))}>
                  지우기
                </button>
              </>
            )}
            {mail.kind === "reward" &&
              (mail.claimed ? (
                <>
                  <span className="mail-claimed">받았어요</span>
                  <button className="primary" disabled={busy === mail.id} onClick={() => run(mail, () => box.remove(mail.id))}>
                    지우기
                  </button>
                </>
              ) : (
                <button className="primary" disabled={busy === mail.id}
                  onClick={() => run(mail, async () => {
                    const amount = await box.claim(mail.id);
                    return amount > 0 ? `${amount}코인을 받았어요.` : "이미 받은 보상이에요.";
                  })}>
                  받기
                </button>
              ))}
          </div>
        </article>
      ))}
    </div>
  );
}
