import { useEffect, useRef, useState } from "react";
import FriendRequestAction from "../../friends/view/FriendRequestAction";
import CharacterSprite from "../../../study/CharacterSprite";
import DeskSet from "../../../study/DeskSet";
import { defaultLook } from "../../character/model/layers";
import { COMPANY_ROOM_ART, companyLayout, foregroundClip, roomArtBox } from "../../../study/companyLayout";
import { useCharacterMovement } from "../../../study/useCharacterMovement";
import type { MemberStatus } from "../model/room";
import type { PresenceMeta } from "../model/roomRealtime";
import { reactionLabel } from "../model/roomConfig";
import { formatStudyTime, presenceLabel, type RoomMove } from "../model/roomRules";
import type { ShownReaction } from "../viewmodel/useRoomLive";

const MOVING = ["walking", "exiting", "standing", "sitting"];

interface Props {
  meta: PresenceMeta;
  status: MemberStatus | undefined;
  reaction: ShownReaction | undefined;
  subscribeMoves: (userId: string, fn: (move: RoomMove) => void) => () => void;
}

/**
 * 같은 방 다른 사람의 캐릭터. 받은 목적지로 내 화면에서 같은 길찾기를 돌려 걷는 모습을 재생한다.
 * 프레임마다 바뀌는 위치는 이 컴포넌트 안에서만 그려져 방 화면 전체를 다시 그리지 않는다.
 */
export default function RemoteCharacter({ meta, status, reaction, subscribeMoves }: Props) {
  const movement = useCharacterMovement(companyLayout, meta.node in companyLayout.nodes ? meta.node : "entrance", () => undefined, {
    node: meta.node,
    position: { x: meta.x, y: meta.y },
    activity: meta.activity,
    direction: meta.direction,
    seatId: meta.seatId,
    occlusionSeatId: meta.activity === "seated" ? meta.seatId : null,
  });
  const character = movement.character;
  const moveTo = movement.moveTo as (to: RoomMove["to"], options: { activity: string; seatId: number | null; allowInterrupt: boolean }) => boolean;
  const pending = useRef<RoomMove | null>(null);
  const run = (move: RoomMove) => {
    try {
      return moveTo(move.to, { activity: move.activity, seatId: move.seatId, allowInterrupt: true });
    } catch {
      // 내 화면에서 경로를 못 찾으면 다음 목적지나 presence 갱신을 기다린다.
      return true;
    }
  };
  const runRef = useRef(run);
  runRef.current = run;
  useEffect(
    () =>
      subscribeMoves(meta.userId, (move) => {
        // 앉기, 일어서기 도중이면 끝난 뒤 마지막 목적지로 간다.
        if (!runRef.current(move)) pending.current = move;
      }),
    [meta.userId, subscribeMoves],
  );
  useEffect(() => {
    if (MOVING.includes(character.activity) || !pending.current) return;
    const move = pending.current;
    pending.current = null;
    runRef.current(move);
  }, [character.activity]);

  const name = status?.displayName ?? meta.name;
  // 캐릭터를 누르면 카드가 고정되어 "친구 요청"을 누를 수 있다. 클릭은 그대로 바닥까지 전달해 기존 이동 클릭을 막지 않는다.
  const [open, setOpen] = useState(false);
  const seat = companyLayout.seats.find(
    (s) => s.id === (character.occlusionSeatId || (character.activity === "seated" ? character.seatId : null)),
  );
  const rect = (seat as { foreground?: { left: number; top: number; right: number; bottom: number } } | undefined)?.foreground;
  // 이 사람의 책상 세트는 앉았거나 가고 있는 자리에 펼친다.
  const deskSeat = seat ?? companyLayout.seats.find((s) => s.id === (character.seatId ?? meta.seatId));
  return (
    <>
      <CharacterSprite character={character} nickname={name} look={status?.look ?? undefined} testId="remote-character" className={`is-remote ${open ? "is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}>
        {reaction && (
          <span className="character-reaction" data-testid="character-reaction">
            {reactionLabel(reaction.key)}
          </span>
        )}
        <span className="character-card" role="tooltip">
          <strong>{name}</strong>
          <span>{presenceLabel(character.activity, status?.state)}</span>
          <span>오늘 {formatStudyTime(status?.todaySeconds ?? 0)}</span>
          {status?.currentTask && <span>지금 하는 일: {status.currentTask}</span>}
          <FriendRequestAction userId={meta.userId} />
        </span>
      </CharacterSprite>
      {rect && (
        <img
          src={COMPANY_ROOM_ART}
          alt=""
          aria-hidden="true"
          className="seat-foreground"
          style={{ ...roomArtBox(companyLayout), clipPath: foregroundClip(rect, companyLayout) }}
        />
      )}
      {deskSeat && <DeskSet seat={deskSeat} look={status?.look ?? defaultLook()} front={!!rect} owner={meta.userId} />}
    </>
  );
}
