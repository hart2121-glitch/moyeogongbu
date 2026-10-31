import { useEffect, useState } from "react";
import { frameIndex, resolvePose, WALK_FRAME_MS } from "./characterSprites";
import { companyLayout } from "./companyLayout";
import { composeLayers, defaultLook } from "../features/character/model/layers";
import SheetFrame from "../features/character/view/SheetFrame";

const FACING_LABEL = { down: "정면", up: "후면", left: "왼쪽", right: "오른쪽" };

/**
 * 방 안의 캐릭터 (Story 009 레이어 시트). 뒷머리, 몸, 의상, 앞머리, 액세서리 시트를 같은 칸 번호로 겹친다.
 * testId, className, children, onClick: 같은 방 다른 사람 캐릭터의 구분과 반응, 마우스 올림 카드 (Story 004).
 * look: 저장한 꾸밈 (Story 007).
 * data-pose(동작.방향)와 data-frame(시트 칸 번호)에 지금 보여 주는 자세가 남는다.
 * @param {{ character: any, nickname: string, look?: any, testId?: string, className?: string, children?: import("react").ReactNode, onClick?: (e: any) => void }} props
 */
export default function CharacterSprite({ character, nickname, look = undefined, testId = "study-character", className = "", children = null, onClick = undefined }) {
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);
  const { action, frames } = resolvePose(character.activity);
  // 의자 착석과 소파 휴식은 지금 게임처럼 출입구를 바라보는 정면이다.
  const facing = action === "sit" || action === "rest" ? "down" : character.direction;
  useEffect(() => {
    setFrame(0);
  }, [action, facing]);
  useEffect(() => {
    if (frames < 2) return;
    // 다음 프레임은 현재 프레임이 커밋된 뒤 예약하여 지연 시 갱신이 뭉치지 않게 합니다.
    const timer = setTimeout(() => setFrame((f) => (f + 1) % frames), WALK_FRAME_MS);
    return () => clearTimeout(timer);
  }, [frames, frame]);
  const index = frameIndex(action, facing, frame);
  const layers = composeLayers(look ?? defaultLook());
  return (
    <div
      className={`study-character activity-${character.activity} facing-${character.direction} ${className}`}
      style={{
        left: `${character.position.x * 100}%`,
        top: `${character.position.y * 100}%`,
        width: `${companyLayout.character.width * 100}%`,
      }}
      data-testid={testId}
      data-activity={character.activity}
      data-x={character.position.x}
      data-y={character.position.y}
      data-direction={character.direction}
      data-pose={`${action}.${facing}`}
      data-frame={index}
      {...Object.fromEntries(layers.map((l) => [`data-layer-${l.id.replace("_", "-")}`, l.itemId ?? ""]))}
      onClick={onClick}
    >
      <span className="character-name">
        {nickname}{" "}
        {{ up: "↑", down: "↓", left: "←", right: "→" }[character.direction]}
      </span>
      {children}
      {failed ? (
        <span className="sprite-fallback">내 캐릭터</span>
      ) : (
        <span className="character-layers">
          {layers.map((l) =>
            l.sheet ? (
              <SheetFrame
                key={l.id}
                sheet={l.sheet}
                index={index}
                layer={l.id}
                order={l.order}
                className={l.className}
                active={l.id === "body"}
                alt={l.id === "body" ? `${nickname} ${FACING_LABEL[facing]} 캐릭터` : ""}
                onError={l.id === "body" ? () => setFailed(true) : undefined}
              />
            ) : null,
          )}
        </span>
      )}
    </div>
  );
}
