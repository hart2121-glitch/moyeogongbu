import { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  Coffee,
  Armchair,
  SignOut,
  DoorOpen,
  Toilet,
  ArrowLeft,
} from "@phosphor-icons/react";
import { ROOM_ART_SIZE, ROOM_BOTTOM_GAP, artBox, foregroundClip, roomArtBox, roomScale } from "./companyLayout";
import { COMPANY_SCENE, RoomSceneContext } from "./roomScene";
import { useCharacterMovement } from "./useCharacterMovement";
import CharacterSprite from "./CharacterSprite";
import DeskSet, { EMPTY_DESK } from "./DeskSet";
import WallClock from "./WallClock";
import { defaultLook } from "../features/character/model/layers";
import { DECOR_DRAW_ORDER, DECOR_ITEM_ART, DEFAULT_DECOR } from "../config/roomDecor";
import { useSeatOccupancy } from "./useSeatOccupancy";

/** 바깥 창의 비율: 보이는 범위(view)의 가로세로. view가 없으면 원본 전체. */
const viewportStyle = ({ image, view = image }) => ({
  aspectRatio: `${view.width} / ${view.height}`,
});

/**
 * 무대를 원본 전체 비율로 키우고 보이는 범위가 창의 왼쪽 위에 오도록 민다.
 * 여백 백분율은 부모 너비 기준이라 가로세로 모두 view.width로 나눈다.
 */
const stageCropStyle = ({ image, view }) =>
  view
    ? {
        width: `${(image.width / view.width) * 100}%`,
        marginLeft: `${(-view.x / view.width) * 100}%`,
        marginTop: `${(-view.y / view.width) * 100}%`,
      }
    : {};

/**
 * 방 배율: 무대와 오른쪽 열이 들어가는 줄(main)의 너비에서 오른쪽 열을 빼고, 창 높이에서 방 윗변 위치와 아래 여백을 뺀 공간에
 * 방 전체가 들어가는 배율 (`roomScale`). 창 크기나 줄 너비가 바뀌면 다시 잰다.
 */
function useRoomScale(mainRef, sideRef) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const measure = () => {
      const gap = parseFloat(getComputedStyle(main).columnGap) || 0;
      const side = sideRef.current ? sideRef.current.getBoundingClientRect().width + gap : 0;
      const top = main.getBoundingClientRect().top + window.scrollY;
      setScale(roomScale(main.clientWidth - side, window.innerHeight - top - ROOM_BOTTOM_GAP));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(main);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [mainRef, sideRef]);
  return scale;
}

/**
 * 실시간 공부방 (회사 스터디룸, 공용 카페). `scene`이 배치와 그림, 문구를 정한다 (`roomScene.js`).
 * `onActivityChange`는 캐릭터 동작이 바뀔 때마다 불리고(공부 세션 입력),
 * `renderSession`은 툴바 아래에 세션 표시를 그린다. 휴게실(카페는 카운터) 이동은 사용자가 누를 때만 일어난다.
 * Story 004: 좌석은 `seatService`(서버 판정)가 정하고, 목적지를 정할 때마다 `onMove`, 멈출 때마다 `onSettle`이 불린다.
 * `overlay`는 무대 안(다른 사람 캐릭터), `side`(할 일, 초대, 방장 도구, 반응, 지금 하는 일)는 무대 오른쪽 열,
 * `localReaction`은 내 머리 위에 그린다. 무대는 남는 화면에 맞춰 키운다 (`roomScale`).
 * 무대는 `layout.view` 범위만 보이도록 바깥 창이 자른다. `subtitle`은 제목 아래 한 줄이다.
 * @param {{ room: any, nickname: string, seatService: any, onExit: () => void, onActivityChange?: (activity: string) => void, onMove?: (move: { to: any, activity: string, seatId: number | null }) => void, onSettle?: (character: any) => void, overlay?: import("react").ReactNode, localReaction?: import("react").ReactNode, look?: any, renderSession?: (actions: { goLounge: () => void, canGoLounge: boolean }) => import("react").ReactNode, side?: import("react").ReactNode, scene?: import("./roomScene").RoomScene, subtitle?: import("react").ReactNode }} props
 */
export default function CompanyRoom({
  room,
  nickname,
  seatService,
  onExit,
  onActivityChange,
  onMove,
  onSettle,
  overlay,
  localReaction,
  renderSession,
  side,
  look = undefined,
  scene = COMPANY_SCENE,
  subtitle = undefined,
}) {
  const layout = scene.layout;
  const { character, moveTo, validateMove, movementError } =
    useCharacterMovement(layout, "entrance", onExit);
  const occupancy = useSeatOccupancy(seatService);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const mainRef = useRef(null);
  const sideRef = useRef(null);
  const scale = useRoomScale(mainRef, sideRef);
  const [floorTarget, setFloorTarget] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [error, setError] = useState("");
  const [backgroundFailed, setBackgroundFailed] = useState(false);
  const moving = ["walking", "exiting", "standing", "sitting"].includes(
    character.activity,
  );
  const locked = moving || pending;
  const seats = layout.seats.map((seat) => ({
    ...seat,
    occupantId: occupancy.seats[seat.id]?.ownerId,
    lease: occupancy.seats[seat.id],
  }));
  const foregroundSeat = layout.seats.find(
    (seat) =>
      seat.id ===
      (character.occlusionSeatId ||
        (character.activity === "seated" ? character.seatId : null)),
  );
  const rect = foregroundSeat?.foreground;
  // 내 책상 세트는 내가 앉았거나 차지한 자리에, 아무도 없는 자리는 소품 없이 모니터만 둔다. 다른 사람 자리는 RemoteCharacter가 그린다.
  const mySeat =
    foregroundSeat ?? seats.find((seat) => seat.occupantId && seat.occupantId === occupancy.ownerId);
  const go = (destination, options) => {
    try {
      setError("");
      const started = moveTo(destination, options);
      if (started)
        onMove?.({
          to: destination,
          activity: options?.activity ?? "seated",
          seatId: options?.seatId ?? null,
        });
      return started;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };
  const withPending = async (action) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    try {
      setError("");
      await action();
    } catch (e) {
      setError(e.message);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };
  const selectSeat = (seat) => {
    if (locked || backgroundFailed || occupancy.error) return;
    withPending(async () => {
      validateMove(seat.node, { activity: "seated", seatId: seat.id });
      if (!(await occupancy.reserve(seat.id))) {
        setError("다른 플레이어가 사용하거나 예약한 좌석이에요.");
        return;
      }
      setFloorTarget(null);
      if (go(seat.node, { activity: "seated", seatId: seat.id }))
        setSelectedSeat(seat.id);
      else await occupancy.release();
    });
  };
  const releaseAndGo = (destination, options) =>
    withPending(async () => {
      await occupancy.release();
      setFloorTarget(null);
      go(destination, options);
    });
  const visit = (area) => releaseAndGo(area.node, { activity: area.activity });
  const rest = () =>
    visit(layout.areas.find((area) => area.id === "sofa"));
  const leaveRestroom = () => releaseAndGo(layout.restroomExit ?? "toiletOuter", { activity: "idle" });
  const resume = () => {
    const seat = layout.seats.find((s) => s.id === selectedSeat);
    if (seat) selectSeat(seat);
  };
  const leave = () => releaseAndGo("entrance", { activity: "exit" });
  const clickFloor = (event) => {
    if (
      pendingRef.current ||
      backgroundFailed ||
      ["standing", "sitting", "exiting"].includes(character.activity)
    )
      return;
    const rect = event.currentTarget.getBoundingClientRect();
    const point = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
    withPending(async () => {
      // 목적지 검사 실패로 기존 착석을 잃지 않도록 먼저 바닥을 확인합니다.
      const { isWalkable } = await import("./navigation");
      if (!isWalkable(layout, point)) {
        setError("벽이나 가구 대신 이동 가능한 바닥을 선택해 주세요.");
        return;
      }
      validateMove(point, { activity: "idle", allowInterrupt: true });
      await occupancy.release();
      if (go(point, { activity: "idle", allowInterrupt: true }))
        setFloorTarget(point);
    });
  };
  useEffect(() => {
    if (character.activity !== "seated") return;
    let cancelled = false;
    occupancy
      .occupy(character.seatId)
      .then((ok) => {
        if (!ok && !cancelled) {
          setError("좌석 예약이 만료되었어요. 다른 자리를 선택해 주세요.");
          const seat = layout.seats.find(
            (s) => s.id === character.seatId,
          );
          go(seat.approach, { activity: "idle" });
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [character.activity, character.seatId]);
  useEffect(() => {
    if (character.activity !== "seated" || occupancy.error) return;
    const lease = occupancy.seats[character.seatId];
    if (lease && lease.ownerId !== occupancy.ownerId) {
      setError("좌석 사용 권한이 변경되어 통로로 이동합니다.");
      const seat = layout.seats.find((s) => s.id === character.seatId);
      go(seat.approach, { activity: "idle" });
    } else if (!lease) {
      // 연결이 2분 넘게 끊겨 서버가 자리를 풀었다.
      setError("연결이 오래 끊겨 자리가 풀렸어요. 다시 자리를 선택해 주세요.");
      const seat = layout.seats.find((s) => s.id === character.seatId);
      go(seat.approach, { activity: "idle" });
    }
  }, [occupancy.seats]);
  useEffect(() => {
    onActivityChange?.(character.activity);
    if (!["walking", "exiting", "standing", "sitting"].includes(character.activity))
      onSettle?.(character);
  }, [character.activity]);
  const lounge = layout.areas.find((area) => area.id === "lounge");
  const restroom = layout.areas.find((area) => area.id === "restroom");
  // 방장이 고른 휴게실 꾸밈과 화이트보드 문구 (꾸미기 슬롯 계획 2절). 같은 방 사람 모두 같은 방 정보를 받는다. 카페에는 없다.
  const decor = { ...DEFAULT_DECOR, ...room.decor };
  const signText = (sign) => (sign.id === "board" && room.boardText ? room.boardText : sign.text);
  const canGoLounge =
    !locked && !backgroundFailed && character.activity !== "lounge";
  const status =
    character.activity === "exiting"
      ? "출입구로 이동 중, 도착하면 내 방으로 돌아가요"
      : ["walking", "standing", "sitting"].includes(character.activity)
        ? "통로를 따라 이동 중"
        : character.activity === "seated"
          ? `${character.seatId}번 좌석 착석, 공부 중`
          : character.activity === "resting"
            ? "소파에서 휴식 중"
            : character.activity === "restroom"
              ? "화장실에 다녀오는 중"
              : character.activity === "lounge"
                ? `${scene.loungeName}에서 쉬는 중`
                : character.node === "entrance"
                  ? "출입구에 도착했어요. 원하는 좌석을 클릭해 주세요."
                  : character.node === "floor"
                    ? "선택한 바닥에 도착했어요. 원하는 자리나 다른 바닥을 선택해 주세요."
                    : "자리를 골라 앉아 주세요.";
  return (
    <RoomSceneContext.Provider value={scene}>
    <div className={`company-room scene-${scene.id}`}>
      <div className="company-toolbar">
        <div>
          <h1>{scene.title}</h1>
          <p>
            {subtitle ?? (
              <>
                {room.name}, {layout.seats.length}석, 초대 코드 {room.inviteCode}
              </>
            )}
          </p>
        </div>
        <div className="company-controls">
          <button
            onClick={() => visit(lounge)}
            disabled={!canGoLounge}
          >
            <DoorOpen /> {lounge.label}
          </button>
          <button
            onClick={() => visit(restroom)}
            disabled={
              locked || backgroundFailed || character.activity === "restroom"
            }
          >
            <Toilet /> {restroom.label}
          </button>
          {character.activity === "restroom" && (
            <button
              onClick={leaveRestroom}
              disabled={locked || backgroundFailed}
            >
              <ArrowLeft /> 화장실 나가기
            </button>
          )}
          <button
            onClick={rest}
            disabled={
              locked || character.activity === "resting" || backgroundFailed
            }
          >
            <Coffee /> 휴식하기
          </button>
          <button
            onClick={resume}
            disabled={
              locked ||
              !selectedSeat ||
              character.activity === "seated" ||
              backgroundFailed
            }
          >
            <Armchair /> 공부 재개하기
          </button>
          <button onClick={leave} disabled={locked}>
            <SignOut /> {scene.exitLabel}
          </button>
        </div>
      </div>
      <div className="room-status">
        <p
          className="movement-status"
          role="status"
          data-testid="movement-status"
        >
          {status}
        </p>
        {renderSession?.({ goLounge: () => visit(lounge), canGoLounge })}
      </div>
      <div className="company-main" ref={mainRef}>
      <div
        className="company-viewport"
        data-scale={scale}
        style={{ ...viewportStyle(layout), width: ROOM_ART_SIZE.width * scale, "--room-scale": scale }}
      >
      <div
        className="company-stage"
        data-testid="company-stage"
        onClick={clickFloor}
        style={{
          aspectRatio: `${layout.image?.width || 1536} / ${layout.image?.height || 1024}`,
          ...stageCropStyle(layout),
        }}
      >
        <img
          className="company-room-art"
          src={scene.art}
          alt={scene.alt}
          style={roomArtBox(layout)}
          draggable={false}
          onError={() => setBackgroundFailed(true)}
        />
        {!backgroundFailed && (
          <>
            {scene.decor && DECOR_DRAW_ORDER.map((slot) => {
              const src = DECOR_ITEM_ART[decor[slot]];
              const box = layout.decorSlots.find((s) => s.id === slot).box;
              return src ? (
                <img
                  key={slot}
                  className="room-decor"
                  src={src}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  data-slot={slot}
                  data-item={decor[slot]}
                  style={artBox(box, layout)}
                />
              ) : null;
            })}
            {seats
              .filter((seat) => !seat.occupantId && seat.id !== mySeat?.id)
              .map((seat) => (
                <DeskSet key={seat.id} seat={seat} look={EMPTY_DESK} />
              ))}
            {layout.wallClock && <WallClock />}
            {layout.signs.map((sign) => (
              <span
                key={sign.id}
                className={`room-sign room-sign-${sign.id}`}
                style={{ left: `${sign.x * 100}%`, top: `${sign.y * 100}%` }}
                aria-hidden="true"
                data-testid={`room-sign-${sign.id}`}
              >
                {signText(sign)}
              </span>
            ))}
            <div
              className="seat-overlay"
              role="group"
              aria-label="좌석 선택"
              onClick={(e) => e.stopPropagation()}
            >
              {seats.map((seat) => (
                <button
                  key={seat.id}
                  className={`seat-marker ${layout.seatMarkersBaked ? "baked" : ""} ${selectedSeat === seat.id ? "is-selected" : ""} ${seat.occupantId ? "is-seated" : ""}`}
                  style={{
                    left: `${seat.label.x * 100}%`,
                    top: `${seat.label.y * 100}%`,
                  }}
                  onClick={() => selectSeat(seat)}
                  disabled={
                    locked ||
                    Boolean(
                      seat.occupantId && seat.occupantId !== occupancy.ownerId,
                    )
                  }
                  aria-label={`${seat.id}번 좌석`}
                  aria-pressed={selectedSeat === seat.id}
                  data-occupied={seat.lease?.state === "occupied"}
                  data-reserved={Boolean(seat.occupantId)}
                  title={
                    seat.lease
                      ? `${seat.lease.name}, ${seat.lease.state === "reserved" ? "이동 중 예약" : "사용 중"}`
                      : "빈 좌석"
                  }
                >
                  {seat.id}
                  {seat.occupantId && (
                    <span>
                      {seat.occupantId === occupancy.ownerId
                        ? "내 자리"
                        : "사용 중"}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div
              className="area-overlay"
              role="group"
              aria-label="공간 이동"
              onClick={(e) => e.stopPropagation()}
            >
              {layout.areas.map((area) => (
                <button
                  key={area.id}
                  className="area-marker"
                  style={{
                    left: `${area.position.x * 100}%`,
                    top: `${area.position.y * 100}%`,
                  }}
                  onClick={() => visit(area)}
                  disabled={locked || character.activity === area.activity}
                  aria-label={`${area.label}, 지도`}
                >
                  {area.marker}
                </button>
              ))}
            </div>
            {floorTarget && (
              <span
                className="floor-target"
                style={{
                  left: `${floorTarget.x * 100}%`,
                  top: `${floorTarget.y * 100}%`,
                }}
                aria-hidden="true"
              />
            )}
            <CharacterSprite character={character} nickname={nickname} look={look}>
              {localReaction}
            </CharacterSprite>
            {overlay}
            {rect && (
              <img
                src={scene.art}
                alt=""
                aria-hidden="true"
                className="seat-foreground"
                style={{ ...roomArtBox(layout), clipPath: foregroundClip(rect, layout) }}
              />
            )}
            {mySeat && (
              <DeskSet seat={mySeat} look={look ?? defaultLook()} front={mySeat.id === foregroundSeat?.id} owner="me" />
            )}
          </>
        )}
      </div>
      </div>
      {side && <aside className="company-side" ref={sideRef}>{side}</aside>}
      </div>
      {backgroundFailed && (
        <div className="room-error" role="alert">
          방 그림을 불러오지 못했어요. 새로고침해 주세요.
          <button onClick={onExit}> 내 방으로 돌아가기</button>
        </div>
      )}
      {occupancy.error && (
        <p className="room-error" role="alert">
          {occupancy.error}
        </p>
      )}
      {(error || movementError) && (
        <p className="room-error" role="alert">
          {error || movementError}
        </p>
      )}
    </div>
    </RoomSceneContext.Provider>
  );
}
