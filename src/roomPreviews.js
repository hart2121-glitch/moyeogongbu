// 확정한 스터디룸 원본만 등록합니다. 로비 배경을 대신 사용하지 않습니다.
// public/assets/rooms/에 파일을 넣은 뒤 null을 '/assets/rooms/office.png'처럼
// 바꾸면 됩니다. 이미지가 없거나 로딩에 실패하면 임시 표시를 유지합니다.
export const roomPreviews = {
  office: {
    src: "/assets/company-study-room.png.png",
    fit: "contain",
    alt: "회사 스터디룸 미리보기",
    placeholder: "원본 이미지 필요",
  },
  school: {
    src: null,
    alt: "학교 스터디룸 미리보기",
    placeholder: "미리보기 준비 중",
  },
};
