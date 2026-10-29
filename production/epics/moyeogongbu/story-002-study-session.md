# Story 002: 공부 세션

> **Epic**: moyeogongbu
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: (set by /dev-story when implementation begins)

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 3

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none (React 19 + Vite 웹 앱) | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

- [ ] 좌석에 앉으면 공부 시간 측정이 자동으로 시작되고 위로 센다.
- [ ] 휴식, 화장실, 퇴근으로 자리를 뜨면 측정이 멈춘다.
- [ ] 앱 페이지 안에서 60분 동안 마우스와 키보드 입력이 없으면, 안부처럼 부드러운 체크인 문구를 띄운다 (예: "60분째 집중 중이에요. 계속할까요?"). 버튼 하나로 응답한다.
- [ ] 5분 안에 답이 없으면 휴식 상태로 바뀌고, 그 5분은 공부 시간에서 빠진다.
- [ ] 뽀모도로를 선택할 수 있다: 25분 공부와 5분 휴식, 50분 공부와 10분 휴식, 직접 설정 (공부 시간 20~60분).
- [ ] 뽀모도로를 쓰는 중에는 따로 체크인하지 않는다. 뽀모도로 종료 알림에 5분 동안 응답이 없으면 체크인 무응답과 똑같이 휴식으로 바뀐다.
- [ ] 뽀모도로 휴식 시간에는 자리에 앉아 있어도 공부 시간에서 빠지고, 휴식이 끝나면 다시 자동으로 센다.
- [ ] 뽀모도로 휴식 시간이 되면 알림과 "휴게실로 가기" 버튼이 뜬다. 캐릭터는 자동으로 움직이지 않는다.
- [ ] 하루는 한국 시간 오전 5시에 바뀐다. 오전 5시를 넘는 세션은 두 날짜로 나눠 기록한다.
- [ ] 같은 계정은 세션 하나만 가진다. 새 탭이나 기기에서 들어오면 그쪽이 세션을 넘겨받고, 이전 화면에는 "다른 곳에서 접속했어요"가 뜬다.
- [ ] 브라우저 알림은 사용자가 허용한 경우에만, 탭이 뒤에 있을 때 뽀모도로 종료와 자리 비움 확인에 보낸다.
- [ ] 세션 시간은 서버에 저장되어 새로고침이나 재접속 후에도 이어진다.
- [ ] 시간 계산은 서버 시각 기준이고 탭을 닫았다 열어도 어긋나지 않는다.
- [ ] 계정을 삭제하면 그 사람의 세션 기록이 모두 지워진다.

---

## Implementation Notes

- 세션 상태 기계(Model)는 저장소와 시계를 주입받아 서버 없이 단위 테스트한다.
- 기존 착석, 휴식, 화장실, 퇴근 동작(`useCharacterMovement`)이 세션 상태의 입력이 된다.
- 방 그림의 타이머와 음악 패널은 정적 그림이므로 툴바의 실제 표시와 구분한다.
- 시간 수치(체크인 60분, 응답 대기 5분, 프리셋, 직접 설정 20~60분, 하루 경계 오전 5시)는 설정 파일로 분리한다.
- 브라우저는 앱 페이지 밖의 입력을 볼 수 없으므로 체크인은 사실상 60분마다 오는 정기 확인이다. 감시처럼 느껴지지 않게 문구를 쓴다.

---

## Out of Scope

- Story 003: 코인 계산과 정산 카드
- Story 004: 다른 사람의 세션 상태 공유

---

## Files

- `src/features/session/model/`
- `src/features/session/viewmodel/`
- `src/features/session/view/`
- `tests/session.test.mjs`

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: 툴바와 자리 비움 확인 문구의 retained screenshot을 `production/qa/evidence/`에 남긴다. 단위 테스트(`tests/session.test.mjs`)는 `qa.level: minimal`이라 권장이다.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/moyeogongbu/story-001-account-foundation.md`
- Unlocks: `production/epics/moyeogongbu/story-003-coin-settlement.md`
