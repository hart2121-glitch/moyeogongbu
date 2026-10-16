import { useEffect, useState } from "react";
import { resolveSprite } from "./characterSprites";
import { companyLayout } from "./companyLayout";
import { getCharacterOcclusion } from "./characterVisibility";

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
  // 착석은 배경 인물을 임시로 사용하며, 출입·인물·가구 가림 구간은 중복 렌더링하지 않습니다.
  if (getCharacterOcclusion(character, companyLayout)) return null;
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
    >
      <span className="character-name">{nickname} · 임시</span>
      {failed ? (
        <span className="sprite-fallback">내 캐릭터</span>
      ) : (
        <img
          src={frames[frame % frames.length]}
          alt={`${nickname} 임시 캐릭터`}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
