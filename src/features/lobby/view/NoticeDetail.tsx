/** 공지 하나를 보여 주는 모달 내용. */
export default function NoticeDetail({ title, body }: { title: string; body?: string }) {
  return (
    <>
      <h2>{title}</h2>
      <p>{body || "모여공부에 오신 걸 환영해요!"}</p>
    </>
  );
}
