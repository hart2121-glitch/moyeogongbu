import { useState } from "react";
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

export default function CompanyRoom({ room, nickname, onExit }) {
  const { character, moveTo } = useCharacterMovement(
    companyLayout,
    "entrance",
    onExit,
  );
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [error, setError] = useState("");
  const [backgroundFailed, setBackgroundFailed] = useState(false);
  const moving = ["walking", "exiting"].includes(character.activity);
  // 좌석 점유는 내 캐릭터 상태에서 별도로 파생. 원본 인물은 실시간 참여자가 아닙니다.
  const seats = companyLayout.seats.map((seat) => ({
    ...seat,
    occupantId:
      character.activity === "seated" && character.seatId === seat.id
        ? "local-self"
        : null,
  }));
  const go = (destination, options) => {
    try {
      setError("");
      return moveTo(destination, options);
    } catch (e) {
      setError(e.message);
      return false;
    }
  };
  const selectSeat = (seat) => {
    if (moving || backgroundFailed) return;
    if (go(seat.node, { activity: "seated", seatId: seat.id }))
      setSelectedSeat(seat.id);
  };
  const visit = (area) => go(area.node, { activity: area.activity });
  const rest = () =>
    visit(companyLayout.areas.find((area) => area.id === "sofa"));
  const leaveRestroom = () => go("toiletOuter", { activity: "idle" });
  const resume = () => {
    const seat = companyLayout.seats.find((s) => s.id === selectedSeat);
    if (seat) go(seat.node, { activity: "seated", seatId: seat.id });
  };
  const leave = () => go("entrance", { activity: "exit" });
  const status =
    character.activity === "exiting"
      ? "출입구로 이동 중 · 도착하면 로비로 돌아갑니다"
      : character.activity === "walking"
        ? "통로를 따라 이동 중"
        : character.activity === "seated"
          ? `${character.seatId}번 좌석 착석 · 공부 중`
          : character.activity === "resting"
            ? "소파에서 휴식 중"
            : character.activity === "restroom"
              ? "화장실 내부 · 나가기 또는 공부 재개하기를 선택해 주세요."
              : character.activity === "lounge"
                ? "휴게실에 도착했어요. 소파에서 쉬거나 좌석으로 돌아갈 수 있어요."
                : character.node === "entrance"
                  ? "출입구에 도착했어요. 원하는 좌석을 클릭해 주세요."
                  : "업무 공간에 도착했어요. 원하는 좌석을 클릭해 주세요.";
  return (
    <div className="company-room">
      <div className="company-toolbar">
        <div>
          <h1>회사 테마 스터디룸</h1>
          <p>
            {room.name} · 실제 참여 1 / {room.capacity}명 · 초대 코드{" "}
            {room.code}
          </p>
        </div>
        <div className="company-controls">
          <button
            onClick={() =>
              visit(companyLayout.areas.find((area) => area.id === "lounge"))
            }
            disabled={
              moving || backgroundFailed || character.activity === "lounge"
            }
          >
            <DoorOpen /> 휴게실로 이동
          </button>
          <button
            onClick={() =>
              visit(companyLayout.areas.find((area) => area.id === "restroom"))
            }
            disabled={
              moving || backgroundFailed || character.activity === "restroom"
            }
          >
            <Toilet /> 화장실 가기
          </button>
          {character.activity === "restroom" && (
            <button
              onClick={leaveRestroom}
              disabled={moving || backgroundFailed}
            >
              <ArrowLeft /> 화장실 나가기
            </button>
          )}
          <button
            onClick={rest}
            disabled={
              moving || character.activity === "resting" || backgroundFailed
            }
          >
            <Coffee /> 휴식하기
          </button>
          <button
            onClick={resume}
            disabled={
              moving ||
              !selectedSeat ||
              character.activity === "seated" ||
              backgroundFailed
            }
          >
            <Armchair /> 공부 재개하기
          </button>
          <button onClick={leave} disabled={moving}>
            <SignOut /> 퇴근하기
          </button>
        </div>
      </div>
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
            <div className="seat-overlay" role="group" aria-label="좌석 선택">
              {seats.map((seat) => (
                <button
                  key={seat.id}
                  className={`seat-marker ${companyLayout.seatMarkersBaked ? "baked" : ""} ${selectedSeat === seat.id ? "is-selected" : ""} ${seat.occupantId ? "is-seated" : ""}`}
                  style={{
                    left: `${seat.label.x * 100}%`,
                    top: `${seat.label.y * 100}%`,
                  }}
                  onClick={() => selectSeat(seat)}
                  disabled={moving}
                  aria-label={`${seat.id}번 좌석`}
                  aria-pressed={selectedSeat === seat.id}
                  data-occupied={Boolean(seat.occupantId)}
                >
                  {!companyLayout.seatMarkersBaked && seat.id}
                  {seat.occupantId && <span>내 자리</span>}
                </button>
              ))}
            </div>
            <div className="area-overlay" role="group" aria-label="공간 이동">
              {companyLayout.areas.map((area) => (
                <button
                  key={area.id}
                  className="area-marker"
                  style={{
                    left: `${area.position.x * 100}%`,
                    top: `${area.position.y * 100}%`,
                  }}
                  onClick={() => visit(area)}
                  disabled={moving || character.activity === area.activity}
                  aria-label={`${area.label} · 지도`}
                >
                  {area.marker}
                </button>
              ))}
            </div>
            <CharacterSprite character={character} nickname={nickname} />
          </>
        )}
      </div>
      {backgroundFailed && (
        <div className="room-error" role="alert">
          회사 원본 이미지를 불러오지 못했어요. 좌석 이동을 중단했습니다.
          <button onClick={onExit}> 로비로 돌아가기</button>
        </div>
      )}
      {error && (
        <p className="room-error" role="alert">
          {error}
        </p>
      )}
      <div className="company-help">
        <p>
          1~3번은 위쪽, 4~6번은 아래쪽 좌석입니다. 번호를 클릭하면 이동합니다.
        </p>
        <p>
          한 명 로컬 데모 · 인물이 없는 6개 의자에 독립 캐릭터가 착석합니다.
          원본의 출입구 인물·이름표만 제거한 화면용 사본을 사용하고 원본 파일은
          그대로 보관합니다.
        </p>
        <details>
          <summary>임시 좌표·캐릭터 안내</summary>
          <p>
            새 원본 기준의 상대 좌표와 고정 경로를 사용합니다. 휴게실 출입
            경계는 유리벽·화분에 가려져 문 통과 전환으로 연결하며, 해당 구간과
            주요 가구에 겹치는 구간에서는 이동 캐릭터를 잠시 숨깁니다. 화장실은
            열린 문 아래쪽을 통해 내부 바닥까지 이동합니다. 픽셀 단위 가구
            충돌·가림 처리는 아직 임시입니다. 이동 중 흔들기 없이 임시 정면
            이미지를 표시하며, 실제 방향별 걷기 프레임은 아직 없어 등록 구조만
            준비되어 있습니다. 의자·소파는 별도 임시 착석 이미지를 사용합니다.
            배경에 그려진 타이머·음악 등의 버튼은 이번 단계의 실제 기능이
            아닙니다.
          </p>
        </details>
      </div>
    </div>
  );
}
