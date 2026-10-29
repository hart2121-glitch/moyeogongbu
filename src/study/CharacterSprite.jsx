import { useEffect, useState } from "react";
import {
  resolveSprite,
  spriteFootPadding,
  walkingFootAnchors,
  spriteFootCenterX,
  approvedBackup,
  characterSprites,
} from "./characterSprites";
import { companyLayout } from "./companyLayout";

// 방향 전환마다 src를 바꾸지 않고 로드한 이미지를 유지합니다.
const registeredSources = [
  ...new Set([
    approvedBackup,
    ...Object.values(characterSprites).flatMap((directions) =>
      Object.values(directions).flat(),
    ),
  ]),
];
/**
 * testId, className, children: 같은 방 다른 사람 캐릭터의 구분과 반응, 마우스 올림 카드 (Story 004).
 * @param {{ character: any, nickname: string, testId?: string, className?: string, children?: import("react").ReactNode }} props
 */
export default function CharacterSprite({ character, nickname, testId = "study-character", className = "", children = null }) {
  const [frame, setFrame] = useState(0);
  const [status, setStatus] = useState({});
  const activity =
    character.activity === "exiting" ? "walking" : character.activity;
  const { frames, mirror } = resolveSprite(activity, character.direction);
  const framesReady = frames.every((path) => status[path] === "ready");
  useEffect(() => {
    setFrame(0);
  }, [frames, framesReady]);
  useEffect(() => {
    if (frames.length < 2 || !framesReady) return;
    // 다음 프레임은 현재 프레임이 커밋된 뒤 예약하여 지연 시 갱신이 뭉치지 않게 합니다.
    const timer = setTimeout(
      () => setFrame((f) => (f + 1) % frames.length),
      140,
    );
    return () => clearTimeout(timer);
  }, [frames, framesReady, frame]);
  const desired =
    frames.length > 1 && !framesReady
      ? characterSprites.idle[character.direction]?.[0] ||
        characterSprites.idle.down[0]
      : frames[frame % frames.length];
  const requested = status[desired] === "error" ? approvedBackup : desired;
  // 새 방향을 읽는 동안 로드된 정면을 유지하여 빈 프레임을 만들지 않습니다.
  const source =
    status[requested] === "ready"
      ? requested
      : status[characterSprites.idle.down[0]] === "ready"
        ? characterSprites.idle.down[0]
        : status[approvedBackup] === "ready"
          ? approvedBackup
          : requested;
  const facing =
    source.match(/idle-(down|up|left|right)/)?.[1] ||
    (["seated", "sitting", "resting"].includes(activity)
      ? "down"
      : character.direction);
  const anchor =
    walkingFootAnchors[source] ||
    (source.includes("/idle-")
      ? {
          centerX: spriteFootCenterX[facing],
          padding: spriteFootPadding[facing],
        }
      : null);
  const footPadding = anchor?.padding || 0;
  const footOffsetX = anchor ? ((43.5 - anchor.centerX) / 87) * 100 : 0;
  const failed =
    status[desired] === "error" && status[approvedBackup] === "error";
  return (
    <div
      className={`study-character activity-${activity} facing-${character.direction} ${mirror ? "mirror-fallback" : ""} ${className}`}
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
    >
      <span className="character-name">
        {nickname}{" "}
        {{ up: "↑", down: "↓", left: "←", right: "→" }[character.direction]}
      </span>
      {children}
      {failed ? (
        <span className="sprite-fallback">내 캐릭터</span>
      ) : (
        [...new Set([...registeredSources, ...frames])].map((path) => (
          <img
            key={path}
            src={path}
            data-active={path === source}
            aria-hidden={path !== source}
            alt={
              path === source
                ? `${nickname} ${{ down: "정면", up: "후면", left: "왼쪽", right: "오른쪽" }[facing]} 캐릭터`
                : ""
            }
            style={{
              display: path === source ? "block" : "none",
              aspectRatio: "87 / 110",
              transform: `translate(${footOffsetX}%, ${(footPadding / 110) * 100}%)`,
            }}
            onLoad={() =>
              setStatus((old) =>
                old[path] === "ready" ? old : { ...old, [path]: "ready" },
              )
            }
            onError={() =>
              setStatus((old) =>
                old[path] === "error" ? old : { ...old, [path]: "error" },
              )
            }
          />
        ))
      )}
    </div>
  );
}
