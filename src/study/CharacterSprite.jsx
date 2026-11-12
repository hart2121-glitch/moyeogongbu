import { useEffect, useRef, useState } from "react";
import { frameIndex, poseFrameMs, prefersReducedMotion, resolvePose, SETTLE_FRAME_MS, SETTLE_FRAMES } from "./characterSprites";
import { useRoomScene } from "./roomScene";
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
  const { layout } = useRoomScene();
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);
  // 좌석이 없는 "sitting"은 소파 같은 구역으로 들어가 앉는 한 걸음이다.
  const { action, frames } = resolvePose(character.activity, { intoArea: !character.occlusionSeatId });
  // 의자 착석과 소파 휴식은 지금 게임처럼 출입구를 바라보는 정면이다.
  const facing = action === "sit" || action === "rest" ? "down" : character.direction;
  const pose = `${action}.${facing}`;
  // 앉는 사이 칸 순번은 자세마다 센다. 처음 그릴 때 이미 앉아 있던 사람은 사이 칸 없이 앉은 칸부터 보인다.
  const [settled, setSettled] = useState({ pose, step: Infinity });
  const settleStep = settled.pose === pose ? settled.step : 0;
  const shownPose = useRef(pose);
  useEffect(() => {
    if (shownPose.current === pose) return;
    shownPose.current = pose;
    setFrame(0);
    setSettled({ pose, step: 0 });
  }, [pose]);
  const settle = SETTLE_FRAMES[action];
  useEffect(() => {
    if (!settle || settleStep >= settle.length) return;
    const timer = setTimeout(() => setSettled((s) => (s.pose === pose ? { pose, step: s.step + 1 } : s)), SETTLE_FRAME_MS);
    return () => clearTimeout(timer);
  }, [settle, settleStep, pose]);
  // 걷기는 이동이라 늘 돌고, 숨쉬기와 책상 앞 동작은 움직임 줄이기 설정이면 멈춰 둔다.
  const loops = frames > 1 && (action === "walk" || !prefersReducedMotion());
  useEffect(() => {
    if (!loops) return;
    // 다음 프레임은 현재 프레임이 커밋된 뒤 예약하여 지연 시 갱신이 뭉치지 않게 합니다.
    const timer = setTimeout(() => setFrame((f) => (f + 1) % frames), poseFrameMs(action));
    return () => clearTimeout(timer);
  }, [loops, frames, frame, action]);
  // 자세가 막 바뀐 그림에서는 이전 자세의 프레임 번호를 쓰지 않는다 (setFrame(0)은 그린 뒤에 반영된다).
  const loopFrame = loops && settled.pose === pose ? frame : 0;
  const index = settle && settleStep < settle.length ? settle[settleStep] : frameIndex(action, facing, loopFrame);
  const layers = composeLayers(look ?? defaultLook());
  return (
    <div
      className={`study-character activity-${character.activity} facing-${character.direction} ${className}`}
      style={{
        left: `${character.position.x * 100}%`,
        top: `${character.position.y * 100}%`,
        width: `${layout.character.width * 100}%`,
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
