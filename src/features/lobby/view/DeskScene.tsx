import { PencilSimple, TShirt, X } from "@phosphor-icons/react";
import type { CSSProperties, Ref } from "react";
import { Link } from "react-router-dom";
import { characterSprites } from "../../../study/characterSprites";
import { useProfile } from "../../account/viewmodel/useAccount";
import { CANVAS, defaultLook } from "../../character/model/layers";
import LayerStack from "../../character/view/LayerStack";
import { useMyHome, useMyLook } from "../../character/viewmodel/useCharacter";
import { ROUTES } from "../../shell/model/paths";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { dayLabel, todayKey } from "../../todos/model/studyDay";
import { LOBBY_SCENE, characterOffset, weekdayOf, type Facing } from "../model/lobbyScene";
import HomeRoomArt from "./HomeRoomArt";

const { size, scale } = LOBBY_SCENE;

/**
 * 로비의 "내 방" 장면. 빈 방 위에 내가 꾸민 가구와 소품 층을 차례로 얹고(꾸미기 슬롯 계획 3절), 꾸민 내 캐릭터를 레이어로 세운다.
 * 방과 캐릭터는 같은 정수 배율(scale)로 그린다. facing은 지금 가리키는 물건 쪽 방향이다.
 */
export default function DeskScene({ facing, characterRef }: { facing: Facing; characterRef: Ref<HTMLDivElement> }) {
  const { modal, tip } = useAppState();
  const look = useMyLook().data ?? defaultLook();
  const home = useMyHome().data ?? {};
  const displayName = useProfile().data?.displayName ?? "";
  const today = todayKey();
  const offset = characterOffset(facing);
  return (
    <div className="desk-scene">
      <div
        className="desk-scene-art"
        role="img"
        aria-label="책상, 안락의자, 창문, 침대가 있는 포근한 내 방"
        style={{ width: size.width, height: size.height, "--scale": scale } as CSSProperties}
      >
        <HomeRoomArt look={home} scale={scale} />
        <div className="desk-character" ref={characterRef} style={{ left: offset.left, top: offset.top, width: CANVAS.width * scale }}>
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
