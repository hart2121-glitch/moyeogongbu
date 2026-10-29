import { useState } from "react";
import {
  DEFAULT_OUTFIT,
  outfitAppliedMessage,
  type Outfit,
} from "../model/character";

/**
 * 캐릭터 스타일. 값은 메모리에만 유지된다. 화면 이름은 계정 프로필(`useProfile`)에서 온다.
 * @param notify 적용 결과를 알리는 토스트 함수
 * @example const { outfit, applyOutfit } = useCharacter(notify);
 */
export function useCharacter(notify: (text: string) => void) {
  const [outfit, setOutfit] = useState<Outfit>(DEFAULT_OUTFIT);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit>(DEFAULT_OUTFIT);
  const applyOutfit = () => {
    setOutfit(selectedOutfit);
    notify(outfitAppliedMessage(selectedOutfit));
  };
  return {
    outfit,
    selectedOutfit,
    setSelectedOutfit,
    applyOutfit,
  };
}
