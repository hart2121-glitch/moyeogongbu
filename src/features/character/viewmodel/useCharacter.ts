import { useState } from "react";
import {
  DEFAULT_NICKNAME,
  DEFAULT_OUTFIT,
  normalizeNickname,
  outfitAppliedMessage,
  type Outfit,
} from "../model/character";

/**
 * 닉네임과 캐릭터 스타일. 값은 메모리에만 유지된다.
 * @param notify 적용 결과를 알리는 토스트 함수
 * @example const { nickname, outfit, applyOutfit } = useCharacter(notify);
 */
export function useCharacter(notify: (text: string) => void) {
  const [outfit, setOutfit] = useState<Outfit>(DEFAULT_OUTFIT);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit>(DEFAULT_OUTFIT);
  const [nickname, setNickname] = useState(DEFAULT_NICKNAME);
  const [nameInput, setNameInput] = useState(DEFAULT_NICKNAME);
  const applyOutfit = () => {
    setOutfit(selectedOutfit);
    notify(outfitAppliedMessage(selectedOutfit));
  };
  /** 입력 닉네임을 저장한다. 저장했으면 true, 빈 입력이면 false. */
  const saveNickname = () => {
    const name = normalizeNickname(nameInput);
    if (!name) return false;
    setNickname(name);
    return true;
  };
  return {
    nickname,
    nameInput,
    setNameInput,
    saveNickname,
    outfit,
    selectedOutfit,
    setSelectedOutfit,
    applyOutfit,
  };
}
