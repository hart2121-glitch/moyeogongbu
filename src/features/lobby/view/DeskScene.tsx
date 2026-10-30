import { PencilSimple, TShirt, X } from "@phosphor-icons/react";
import type { Ref } from "react";
import { Link } from "react-router-dom";
import { characterSprites } from "../../../study/characterSprites";
import { useProfile } from "../../account/viewmodel/useAccount";
import { defaultLook } from "../../character/model/layers";
import LayerStack from "../../character/view/LayerStack";
import { useMyLook } from "../../character/viewmodel/useCharacter";
import { ROUTES } from "../../shell/model/paths";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { dayLabel, todayKey } from "../../todos/model/studyDay";
import { LOBBY_SCENE, characterOffset, weekdayOf, type Facing } from "../model/lobbyScene";

const { size, floorTop } = LOBBY_SCENE;

/**
 * 로비의 "내 방" 장면. 벽지와 나무 마루를 1배로 깐 방에 꾸민 내 캐릭터를 레이어로 세운다.
 * facing은 지금 가리키는 물건 쪽 방향이다.
 */
export default function DeskScene({ facing, characterRef }: { facing: Facing; characterRef: Ref<HTMLDivElement> }) {
  const { modal, tip } = useAppState();
  const look = useMyLook().data ?? defaultLook();
  const displayName = useProfile().data?.displayName ?? "";
  const today = todayKey();
  const offset = characterOffset(facing);
  return (
    <div className="desk-scene">
      <div
        className="desk-scene-art"
        role="img"
        aria-label="벽지와 나무 마루가 있는 내 방"
        style={{ width: size.width, height: size.height }}
      >
        <div className="home-wall" style={{ height: floorTop }} />
        <div className="home-floor" style={{ top: floorTop }} />
        <div className="desk-character" ref={characterRef} style={{ left: offset.left, top: offset.top }}>
          {tip.tip && (
            <div className="desk-speech">
              <p>오늘도 조금씩, 잘 하고 있어!</p>
              <button aria-label="응원 메시지 닫기" onClick={tip.dismissTip}>
                <X />
              </button>
            </div>
          )}
          <LayerStack
            className="desk-character-layers"
            look={look}
            baseSrc={characterSprites.idle[facing][0]}
            direction={facing}
            label={`${displayName} 캐릭터`}
          />
        </div>
        <div className="desk-nameplate">
        <div className="desk-owner">
          <h1>{displayName}</h1>
          <span>의 방</span>
          <button aria-label="프로필 수정" onClick={() => modal.openModal("profile")}>
            <PencilSimple />
          </button>
        </div>
        <div className="desk-meta">
          <p className="desk-date">
            {dayLabel(today)} {weekdayOf(today)}요일
          </p>
          <Link className="desk-dress" to={ROUTES.character}>
            <TShirt weight="duotone" /> 캐릭터 꾸미기
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
