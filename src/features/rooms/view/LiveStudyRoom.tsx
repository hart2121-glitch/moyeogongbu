import { useEffect, useRef, useState } from "react";
import CompanyRoom from "../../../study/CompanyRoom";
import { COMPANY_SCENE } from "../../../study/roomScene";
import { todayCoins } from "../../coins/model/coinMath";
import type { CoinDaySummary } from "../../coins/model/coins";
import SettlementCard from "../../coins/view/SettlementCard";
import { useCoinSummary, useSettleStudy } from "../../coins/viewmodel/useCoins";
import RoomInviteButton from "../../mailbox/view/RoomInviteButton";
import type { Room } from "../../room/model/room";
import { reactionLabel } from "../../room/model/roomConfig";
import OwnerTools from "../../room/view/OwnerTools";
import RemoteCharacter from "../../room/view/RemoteCharacter";
import RoomLiveBar from "../../room/view/RoomLiveBar";
import RoomTodos from "../../room/view/RoomTodos";
import { useRoomLive, type RoomPhase } from "../../room/viewmodel/useRoomLive";
import StudySessionBar from "../../session/view/StudySessionBar";
import { useStudySession } from "../../session/viewmodel/useStudySession";
import { useMyLook } from "../../character/viewmodel/useCharacter";
import RoomNotice from "./RoomNotice";

/** 방 장면 (src/study/roomScene.js의 COMPANY_SCENE, CAFE_SCENE). */
export type RoomScene = typeof COMPANY_SCENE;

/** 들어가지 못했거나 방에서 밀려났을 때 보여 줄 문구 (방 종류별). */
const BLOCKED_TEXT: Record<Room["kind"], Record<Exclude<RoomPhase, "entering" | "ready">, string>> = {
  company: {
    full: "방이 가득 찼어요",
    gone: "이 방의 멤버가 아니에요. 강퇴됐거나 방에서 나갔어요.",
    error: "방에 연결하지 못했어요. 잠시 뒤 다시 들어와 주세요.",
  },
  cafe: {
    full: "카페 자리가 다 찼어요.",
    gone: "오래 자리를 비워 카페에서 나왔어요.",
    error: "카페에 연결하지 못했어요. 잠시 뒤 다시 들어와 주세요.",
  },
};

interface Props {
  room: Room;
  userId: string;
  nickname: string;
  scene: RoomScene;
  /** 정산 카드를 닫은 뒤 (내 방으로). */
  exit: () => void;
  /** 들어가지 못했을 때 보여 줄 단추. 회사 방은 방 목록으로, 카페는 다시 들어가기. */
  blocked: { label: string; action: () => void };
}

interface SettledCharacter {
  node: string;
  position: { x: number; y: number };
  activity: string;
  seatId: number | null;
  direction: string;
}

/**
 * 실시간 공부방 한 곳: 회사 방과 공용 카페가 같이 쓴다 (Story 004, 011).
 * 입장, 공부 세션, 다른 사람 캐릭터, 반응, 할 일, 퇴근 정산을 묶고, 그림과 문구는 장면(scene)에서 가져온다.
 * 회사 방에만 친구 초대와 방장 도구가 있다.
 */
export default function LiveStudyRoom({ room, userId, nickname, scene, exit, blocked }: Props) {
  const myLook = useMyLook().data;
  const live = useRoomLive(room.id, userId, nickname, scene.layout.nodes);
  const session = useStudySession();
  const coins = useCoinSummary().data;
  const settle = useSettleStudy();
  const [card, setCard] = useState<CoinDaySummary | null>(null);
  const leaving = useRef(false);
  const activity = useRef("idle");
  const connectedRef = useRef(live.connected);
  connectedRef.current = live.connected;
  const { reportActivity } = session;

  // 연결이 끊기면 그 순간 공부 측정을 멈춘다 (서버 쪽 2분 유예는 Story 002). 다시 연결되면 지금 동작으로 되돌린다.
  const report = (value: string) => {
    activity.current = value;
    reportActivity(connectedRef.current ? value : "disconnected");
  };
  useEffect(() => {
    reportActivity(live.connected ? activity.current : "disconnected");
  }, [live.connected, reportActivity]);

  if (live.phase === "entering")
    return <RoomNotice message={room.kind === "cafe" ? "카페에 들어가는 중이에요." : "방에 들어가는 중이에요."} />;
  if (live.phase !== "ready")
    return (
      <RoomNotice
        testId="room-blocked"
        message={BLOCKED_TEXT[room.kind][live.phase]}
        actions={
          <>
            <button className="primary" onClick={blocked.action}>
              {blocked.label}
            </button>
            <button className="secondary-button" onClick={exit}>
              내 방으로
            </button>
          </>
        }
      />
    );

  const onExit = async () => {
    if (leaving.current) return;
    leaving.current = true;
    try {
      await session.flush();
      setCard(await settle());
    } catch {
      // 정산을 받지 못하면 다음 방문 때 지난 정산으로 보여 준다.
      exit();
    }
  };
  const coinsToday = coins ? todayCoins(coins.coins, session.todaySeconds, coins.rules) : null;
  const mine = live.reactions[userId];
  const isCafe = room.kind === "cafe";

  return (
    <>
      <CompanyRoom
        room={room}
        scene={scene}
        subtitle={isCafe ? `${scene.layout.seats.length}석, 지금 ${live.others.length + 1}명` : undefined}
        nickname={nickname}
        look={myLook ?? undefined}
        seatService={live.seatService}
        onExit={() => void onExit()}
        onActivityChange={report}
        onMove={live.sendMove}
        onSettle={(c: SettledCharacter) =>
          live.track({ node: c.node, x: c.position.x, y: c.position.y, activity: c.activity, seatId: c.seatId, direction: c.direction })
        }
        localReaction={
          mine && (
            <span className="character-reaction" data-testid="character-reaction">
              {reactionLabel(mine.key)}
            </span>
          )
        }
        overlay={live.others.map((meta) => (
          <RemoteCharacter
            key={meta.userId}
            meta={meta}
            status={live.statusOf(meta.userId)}
            reaction={live.reactions[meta.userId]}
            subscribeMoves={live.subscribeMoves}
          />
        ))}
        side={
          <>
            <RoomTodos />
            <div className="room-social">
              {!isCafe && <RoomInviteButton room={room} />}
              {!isCafe && room.isOwner && <OwnerTools room={room} members={live.members} onChanged={live.notifyMembers} />}
              <RoomLiveBar connected={live.connected} sendReaction={live.sendReaction} onTaskSaved={live.notifyMembers} />
            </div>
          </>
        }
        renderSession={({ goLounge, canGoLounge }: { goLounge: () => void; canGoLounge: boolean }) => (
          <StudySessionBar
            session={session}
            onGoLounge={goLounge}
            canGoLounge={canGoLounge}
            todayCoins={coinsToday}
            words={scene.words}
          />
        )}
      />
      {card && (
        <SettlementCard
          title="오늘의 정산"
          summary={card}
          actionLabel="내 방으로 가기"
          timeLabel={scene.words.time}
          onClose={exit}
        />
      )}
    </>
  );
}
