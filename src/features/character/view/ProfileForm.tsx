import { MAX_NICKNAME_LENGTH } from "../model/character";
import { useAppState } from "../../shell/viewmodel/AppStateContext";

/** 프로필 수정 모달 내용. */
export default function ProfileForm() {
  const { character, modal } = useAppState();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (character.saveNickname()) modal.closeModal();
      }}
    >
      <label htmlFor="nickname">닉네임</label>
      <input
        id="nickname"
        required
        maxLength={MAX_NICKNAME_LENGTH}
        value={character.nameInput}
        onChange={(e) => character.setNameInput(e.target.value)}
      />
      <button className="primary">저장하기</button>
    </form>
  );
}
