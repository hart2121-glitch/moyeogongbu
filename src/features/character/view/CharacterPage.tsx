import { Check } from "@phosphor-icons/react";
import { useProfile } from "../../account/viewmodel/useAccount";
import PageFrame from "../../shell/view/PageFrame";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { AVATAR_SRC, OUTFITS } from "../model/character";

export default function CharacterPage() {
  const { character } = useAppState();
  const { selectedOutfit } = character;
  const displayName = useProfile().data?.displayName;
  return (
    <PageFrame title="캐릭터 꾸미기">
      <div className="page-intro">
        <span className="eyebrow">MY LITTLE CHARACTER</span>
        <h1>오늘은 어떤 분위기로 공부할까?</h1>
        <p>좋아하는 색을 골라 나만의 캐릭터를 꾸며 보세요.</p>
      </div>
      <div className="customizer">
        <div className="avatar-preview">
          <img
            className={`outfit-${selectedOutfit}`}
            src={AVATAR_SRC}
            alt={`${selectedOutfit} 캐릭터 미리보기`}
          />
          <strong>{displayName}</strong>
          <span>{selectedOutfit} 스타일</span>
        </div>
        <div className="wardrobe">
          <h2>내 스타일</h2>
          <div className="outfit-options">
            {OUTFITS.map((o) => (
              <button
                key={o}
                aria-pressed={selectedOutfit === o}
                className={selectedOutfit === o ? "selected" : ""}
                onClick={() => character.setSelectedOutfit(o)}
              >
                <img className={`outfit-${o}`} src={AVATAR_SRC} alt="" />
                {o}
                {selectedOutfit === o && <Check />}
              </button>
            ))}
          </div>
          <p className="muted">기본 제공 스타일 · 색상 미리보기</p>
          <button className="primary" onClick={character.applyOutfit}>
            이 스타일로 적용하기
          </button>
        </div>
      </div>
    </PageFrame>
  );
}
