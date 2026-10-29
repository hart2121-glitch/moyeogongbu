import { useBlocks, useFriendActions } from "../viewmodel/useFriends";

/** 설정의 차단 목록. 해제하면 다시 친구 요청을 주고받을 수 있다. */
export default function BlockList() {
  const blocks = useBlocks();
  const { unblock } = useFriendActions();
  const list = blocks.data ?? [];
  return (
    <section className="block-list" aria-label="차단 목록">
      <h3>차단 목록</h3>
      {blocks.isSuccess && list.length === 0 && <p className="muted">차단한 사람이 없어요.</p>}
      {list.map((b) => (
        <div className="block-row" key={b.userId}>
          <span>{b.name}</span>
          <button className="primary" onClick={() => void unblock(b.userId).catch(() => undefined)}>
            차단 해제
          </button>
        </div>
      ))}
    </section>
  );
}
