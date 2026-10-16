import { useState } from "react";
import { Coffee, Armchair, SignOut } from "@phosphor-icons/react";
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
  const rest = () => go("sofa", { activity: "resting" });
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
            : "출입구에 도착했어요. 원하는 좌석을 클릭해 주세요.";
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
      <div className="company-stage" data-testid="company-stage">
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
                  className={`seat-marker ${selectedSeat === seat.id ? "is-selected" : ""} ${seat.occupantId ? "is-seated" : ""}`}
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
                  {seat.id}
                  {seat.occupantId && <span>내 자리</span>}
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
          한 명 로컬 데모 · 원본에 그려진 여섯 인물은 배경이며 실제 참여자가
          아닙니다. 착석하면 내 이동 캐릭터를 숨기고 원본 인물과 ‘내 자리’
          표시를 임시 착석 표현으로 사용합니다.
        </p>
        <details>
          <summary>임시 좌표·캐릭터 안내</summary>
          <p>
            통로와 의자 좌표는 가려진 원본을 기준으로 한 임시값입니다. 바닥 충돌
            판정 대신 책상 뒤·중앙 경계·왼쪽 통로를 잇는 고정 경로를 사용합니다.
            임시 정면 캐릭터를 흔들어 걷기·휴식을 표시하며, 방향별 걷기·착석
            스프라이트는 아직 없습니다. 배경에 그려진 타이머·음악 등의 버튼은
            이번 단계의 실제 기능이 아닙니다.
          </p>
        </details>
      </div>
    </div>
  );
}
