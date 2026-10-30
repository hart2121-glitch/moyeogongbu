import { useState, useEffect, useRef } from "react";
import {
  Coffee,
  Armchair,
  SignOut,
  DoorOpen,
  Toilet,
  ArrowLeft,
} from "@phosphor-icons/react";
import { COMPANY_BACKGROUND, companyLayout } from "./companyLayout";
import { useCharacterMovement } from "./useCharacterMovement";
import CharacterSprite from "./CharacterSprite";
import { useSeatOccupancy } from "./useSeatOccupancy";

/**
 * 회사 스터디룸. `onActivityChange`는 캐릭터 동작이 바뀔 때마다 불리고(공부 세션 입력),
 * `renderSession`은 툴바 아래에 세션 표시를 그린다. 휴게실 이동은 사용자가 누를 때만 일어난다.
 * Story 004: 좌석은 `seatService`(서버 판정)가 정하고, 목적지를 정할 때마다 `onMove`, 멈출 때마다 `onSettle`이 불린다.
 * `overlay`는 무대 안(다른 사람 캐릭터), `toolbarExtra`(반응, 지금 하는 일, 방장 도구)는 무대 바로 아래, `localReaction`은 내 머리 위에 그린다.
 * @param {{ room: any, nickname: string, seatService: any, onExit: () => void, onActivityChange?: (activity: string) => void, onMove?: (move: { to: any, activity: string, seatId: number | null }) => void, onSettle?: (character: any) => void, overlay?: import("react").ReactNode, toolbarExtra?: import("react").ReactNode, localReaction?: import("react").ReactNode, renderSession?: (actions: { goLounge: () => void, canGoLounge: boolean }) => import("react").ReactNode }} props
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
  toolbarExtra,
  localReaction,
  renderSession,
}) {
  const { character, moveTo, validateMove, movementError } =
    useCharacterMovement(companyLayout, "entrance", onExit);
  const occupancy = useSeatOccupancy(seatService);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [floorTarget, setFloorTarget] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [error, setError] = useState("");
  const [backgroundFailed, setBackgroundFailed] = useState(false);
  const moving = ["walking", "exiting", "standing", "sitting"].includes(
    character.activity,
  );
  const locked = moving || pending;
  const seats = companyLayout.seats.map((seat) => ({
    ...seat,
    occupantId: occupancy.seats[seat.id]?.ownerId,
    lease: occupancy.seats[seat.id],
  }));
  const foregroundSeat = companyLayout.seats.find(
    (seat) =>
      seat.id ===
      (character.occlusionSeatId ||
        (character.activity === "seated" ? character.seatId : null)),
  );
  const rect = foregroundSeat?.foreground;
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
    visit(companyLayout.areas.find((area) => area.id === "sofa"));
  const leaveRestroom = () => releaseAndGo("toiletOuter", { activity: "idle" });
  const resume = () => {
    const seat = companyLayout.seats.find((s) => s.id === selectedSeat);
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
      if (!isWalkable(companyLayout, point)) {
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
          const seat = companyLayout.seats.find(
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
      const seat = companyLayout.seats.find((s) => s.id === character.seatId);
      go(seat.approach, { activity: "idle" });
    } else if (!lease) {
      // 연결이 2분 넘게 끊겨 서버가 자리를 풀었다.
      setError("연결이 오래 끊겨 자리가 풀렸어요. 다시 자리를 선택해 주세요.");
      const seat = companyLayout.seats.find((s) => s.id === character.seatId);
      go(seat.approach, { activity: "idle" });
    }
  }, [occupancy.seats]);
  useEffect(() => {
    onActivityChange?.(character.activity);
    if (!["walking", "exiting", "standing", "sitting"].includes(character.activity))
      onSettle?.(character);
  }, [character.activity]);
  const lounge = companyLayout.areas.find((area) => area.id === "lounge");
  const canGoLounge =
    !locked && !backgroundFailed && character.activity !== "lounge";
  const status =
    character.activity === "exiting"
      ? "출입구로 이동 중, 도착하면 로비로 돌아갑니다"
      : ["walking", "standing", "sitting"].includes(character.activity)
        ? "통로를 따라 이동 중"
        : character.activity === "seated"
          ? `${character.seatId}번 좌석 착석, 공부 중`
          : character.activity === "resting"
            ? "소파에서 휴식 중"
            : character.activity === "restroom"
              ? "화장실 내부예요. 나가기 또는 공부 재개하기를 선택해 주세요."
              : character.activity === "lounge"
                ? "휴게실에 도착했어요. 소파에서 쉬거나 좌석으로 돌아갈 수 있어요."
                : character.node === "entrance"
                  ? "출입구에 도착했어요. 원하는 좌석을 클릭해 주세요."
                  : character.node === "floor"
                    ? "선택한 바닥에 도착했어요. 원하는 자리나 다른 바닥을 선택해 주세요."
                    : "업무 공간에 도착했어요. 원하는 좌석을 클릭해 주세요.";
  return (
    <div className="company-room">
      <div className="company-toolbar">
        <div>
          <h1>회사 테마 스터디룸</h1>
          <p>
            {room.name}, {companyLayout.seats.length}석, 초대 코드{" "}
            {room.inviteCode}
          </p>
        </div>
        <div className="company-controls">
          <button
            onClick={() => visit(lounge)}
            disabled={!canGoLounge}
          >
            <DoorOpen /> 휴게실로 이동
          </button>
          <button
            onClick={() =>
              visit(companyLayout.areas.find((area) => area.id === "restroom"))
            }
            disabled={
              locked || backgroundFailed || character.activity === "restroom"
            }
          >
            <Toilet /> 화장실 가기
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
            <SignOut /> 퇴근하기
          </button>
        </div>
      </div>
      {renderSession?.({ goLounge: () => visit(lounge), canGoLounge })}
      <p
        className="movement-status"
        role="status"
        data-testid="movement-status"
      >
        {status}
      </p>
      <div
        className="company-stage"
        data-testid="company-stage"
        onClick={clickFloor}
        style={{
          aspectRatio: `${companyLayout.image?.width || 1536} / ${companyLayout.image?.height || 1024}`,
        }}
      >
        <img
          className="company-original"
          src={COMPANY_BACKGROUND}
          alt="최종 확정 회사 스터디룸 원본"
          onError={() => setBackgroundFailed(true)}
        />
        {!backgroundFailed && (
          <>
            <div
              className="seat-overlay"
              role="group"
              aria-label="좌석 선택"
              onClick={(e) => e.stopPropagation()}
            >
              {seats.map((seat) => (
                <button
                  key={seat.id}
                  className={`seat-marker ${companyLayout.seatMarkersBaked ? "baked" : ""} ${selectedSeat === seat.id ? "is-selected" : ""} ${seat.occupantId ? "is-seated" : ""}`}
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
                  {!companyLayout.seatMarkersBaked && seat.id}
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
              {companyLayout.areas.map((area) => (
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
            <CharacterSprite character={character} nickname={nickname}>
              {localReaction}
            </CharacterSprite>
            {overlay}
            {rect && (
              <img
                src={COMPANY_BACKGROUND}
                alt=""
                aria-hidden="true"
                className="seat-foreground"
                style={{
                  clipPath: `polygon(${rect.left * 100}% ${rect.top * 100}%,${rect.right * 100}% ${rect.top * 100}%,${rect.right * 100}% ${rect.bottom * 100}%,${rect.left * 100}% ${rect.bottom * 100}%)`,
                }}
              />
            )}
          </>
        )}
      </div>
      {toolbarExtra}
      {backgroundFailed && (
        <div className="room-error" role="alert">
          회사 원본 이미지를 불러오지 못했어요. 좌석 이동을 중단했습니다.
          <button onClick={onExit}> 로비로 돌아가기</button>
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
      <div className="company-help">
        <p>
          바닥을 클릭하면 이동합니다. 1~3번은 위쪽, 4~6번은 아래쪽 좌석입니다.
        </p>
        <p>
          좌석은 서버가 정해요. 같은 자리를 동시에 눌러도 한 명만 앉고, 연결이
          2분 넘게 끊기면 자리가 풀려요.
        </p>
        <details>
          <summary>캐릭터 에셋과 이동 안내</summary>
          <p>
            확정 원본의 연보라색 머리 정면 그림을 분리해 사용합니다. 걷기 방향은
            화살표로 표시하며 실제 옆, 뒤 걷기/앉기 프레임은 아직 없습니다. 없는
            동작을 다른 캐릭터로 대체하지 않습니다. 이동 중 전체 캐릭터를 숨기지
            않고, 착석 때는 원본의 모니터와 책상 픽셀을 전경으로 겹쳐 다리를
            가립니다. 배경 타이머와 음악은 기존 정적 이미지 상태입니다.
          </p>
        </details>
      </div>
    </div>
  );
}
