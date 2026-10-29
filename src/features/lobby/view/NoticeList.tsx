import { NOTICES } from "../model/notices";

/** 공지사항 전체 보기 모달 내용. */
export default function NoticeList() {
  return (
    <div className="notice-details">
      {NOTICES.map(({ tag, title }) => (
        <article key={title}>
          <span className="tag">{tag}</span>
          <h2>{title}</h2>
          <p>
            모여공부의 새로운 소식을 기다려 주세요. 현재는 첫 버전의 예시
            공지입니다.
          </p>
        </article>
      ))}
    </div>
  );
}
