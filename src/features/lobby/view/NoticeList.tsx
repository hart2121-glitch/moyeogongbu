import { useNotices } from "../viewmodel/useNotices";

/** 공지사항 전체 보기 모달 내용 (서버 공지). */
export default function NoticeList() {
  const notices = useNotices();
  return (
    <div className="notice-details">
      {notices.map(({ tag, title, body }) => (
        <article key={title}>
          <span className="tag">{tag}</span>
          <h2>{title}</h2>
          <p>{body}</p>
        </article>
      ))}
    </div>
  );
}
