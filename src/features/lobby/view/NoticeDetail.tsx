/** 공지 하나를 보여 주는 모달 내용. */
export default function NoticeDetail({ title }: { title: string }) {
  return (
    <>
      <h2>{title}</h2>
      <p>모여공부에 오신 걸 환영해요!</p>
      <p className="muted">
        이 공지는 화면 구성을 위한 예시입니다. 실제 이벤트와 업데이트는 앞으로
        만나요.
      </p>
    </>
  );
}
