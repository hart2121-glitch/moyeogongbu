import DisplayNameField from "../../account/view/DisplayNameField";
import { useDisplayNameForm, useProfile } from "../../account/viewmodel/useAccount";
import { useAppState } from "../../shell/viewmodel/AppStateContext";

/** 프로필 수정 모달 내용. 화면 이름을 프로필에 저장한다. */
export default function ProfileForm() {
  const { modal } = useAppState();
  const form = useDisplayNameForm(useProfile().data?.displayName ?? "");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (await form.save()) modal.closeModal();
      }}
    >
      <DisplayNameField value={form.nameInput} onChange={form.setNameInput} />
      {form.failed && <p role="alert">저장하지 못했어요. 다시 시도해 주세요.</p>}
      <button className="primary" disabled={!form.valid || form.saving}>
        저장하기
      </button>
    </form>
  );
}
