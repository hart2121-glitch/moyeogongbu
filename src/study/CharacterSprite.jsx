import { useEffect, useState } from "react";
import {
  resolveSprite,
  spriteFootPadding,
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
export default function CharacterSprite({ character, nickname }) {
  const [frame, setFrame] = useState(0);
  const [status, setStatus] = useState({});
  const activity =
    character.activity === "exiting" ? "walking" : character.activity;
  const { frames, mirror } = resolveSprite(activity, character.direction);
  useEffect(() => {
    setFrame(0);
    if (frames.length < 2) return;
    const timer = setInterval(
      () => setFrame((f) => (f + 1) % frames.length),
      140,
    );
    return () => clearInterval(timer);
  }, [frames]);
  const desired = frames[frame % frames.length];
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
  const usesIdle = source.includes("/idle-");
  const footPadding = usesIdle ? spriteFootPadding[facing] || 0 : 0;
  const footOffsetX = usesIdle
    ? ((43.5 - spriteFootCenterX[facing]) / 87) * 100
    : 0;
  const failed =
    status[desired] === "error" && status[approvedBackup] === "error";
  return (
    <div
      className={`study-character activity-${activity} facing-${character.direction} ${mirror ? "mirror-fallback" : ""}`}
      style={{
        left: `${character.position.x * 100}%`,
        top: `${character.position.y * 100}%`,
        width: `${companyLayout.character.width * 100}%`,
      }}
      data-testid="study-character"
      data-activity={character.activity}
      data-x={character.position.x}
      data-y={character.position.y}
      data-direction={character.direction}
    >
      <span className="character-name">
        {nickname} ·{" "}
        {{ up: "↑", down: "↓", left: "←", right: "→" }[character.direction]}
      </span>
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
