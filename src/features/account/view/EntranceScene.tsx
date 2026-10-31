import type { CSSProperties, ReactNode } from "react";
import { characterSprites } from "../../../study/characterSprites";
import { CANVAS, defaultLook } from "../../character/model/layers";
import LayerStack from "../../character/view/LayerStack";
import { characterOffset } from "../../lobby/model/lobbyScene";
import { ENTRANCE_SCENE } from "../model/entranceScene";

const { size, signBox, feet } = ENTRANCE_SCENE;
/** 1배 px 값을 장면 배율(--s, authFrame.css)만큼 키운 CSS 길이. */
const px = (n: number) => `calc(${n}px * var(--s))`;

/**
 * 집 현관 장면: 문 위 나무 문패에 sign 글자를 새기고, character가 있으면 기본 모습의 캐릭터를 문 앞 매트에 세운다.
 * 글자는 바로 옆 입력칸이나 제목과 같은 내용이라 장면 전체를 화면 낭독에서 감춘다.
 * @example <EntranceScene sign="밍구의 방" character />
 */
export default function EntranceScene({ sign, placeholder = false, character = false }: { sign: ReactNode; placeholder?: boolean; character?: boolean }) {
  const offset = characterOffset("down", feet, 1);
  return (
    <div className="entrance-scene" aria-hidden="true">
      <div className="entrance-art" style={{ width: px(size.width), height: px(size.height) }}>
        <img src={ENTRANCE_SCENE.art} alt="" draggable={false} style={{ width: px(size.width) }} />
        <div className="entrance-sign-row" style={{ top: px(signBox.top), width: px(signBox.centerX * 2) }}>
          <strong
            className={`entrance-sign${placeholder ? " is-empty" : ""}`}
            style={{ height: px(signBox.height), minWidth: px(signBox.minWidth), borderImageSource: `url("${ENTRANCE_SCENE.sign}")` } as CSSProperties}
          >
            {sign}
          </strong>
        </div>
        {character && (
          <div className="entrance-character" style={{ left: px(offset.left), top: px(offset.top), width: px(CANVAS.width) }}>
            <LayerStack look={defaultLook()} baseSrc={characterSprites.idle.down[0]} direction="down" label="" />
          </div>
        )}
      </div>
    </div>
  );
}
