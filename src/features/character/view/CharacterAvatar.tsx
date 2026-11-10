import { defaultLook, type Look } from "../model/layers";
import LayerStack from "./LayerStack";
import "./characterAvatar.css";

/**
 * 꾸민 캐릭터의 머리만 보이는 작은 얼굴 (친구 목록, 로비 휴대폰). 56×72 칸을 정수 배율(scale)로 그리고
 * 머리(가로 4~52, 세로 4~48칸)만 창에 맞춘다. 꾸미기 선택지의 머리 썸네일과 같은 자리다.
 * look이 없으면(처음 꾸미기 전) 기본 모습으로 그린다.
 * @example <CharacterAvatar look={friend.look} scale={2} />
 */
export default function CharacterAvatar({ look, scale = 1, className = "" }: { look: Look | null; scale?: 1 | 2; className?: string }) {
  return (
    <span className={`character-avatar scale-${scale} ${className}`} aria-hidden="true">
      <LayerStack look={look ?? defaultLook()} label="" decorative className="avatar-stack" />
    </span>
  );
}
