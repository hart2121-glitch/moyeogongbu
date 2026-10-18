import { useEffect, useState } from "react";
import { resolveSprite } from "./characterSprites";
import { companyLayout } from "./companyLayout";

export default function CharacterSprite({ character, nickname }) {
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);
  const activity =
    character.activity === "exiting" ? "walking" : character.activity;
  const { frames, mirror } = resolveSprite(activity, character.direction);
  useEffect(() => {
    setFrame(0);
    setFailed(false);
    if (frames.length < 2) return;
    const timer = setInterval(
      () => setFrame((f) => (f + 1) % frames.length),
      140,
    );
    return () => clearInterval(timer);
  }, [frames]);
  // DOM/이미지를 제거하지 않습니다. 실제 가림은 원본 전경 레이어로 처리합니다.
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
        <img
          src={frames[frame % frames.length]}
          style={{ aspectRatio: "87 / 110" }}
          alt={`${nickname} 확정 정면 캐릭터`}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
