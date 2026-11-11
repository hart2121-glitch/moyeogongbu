# Story 012: 공부방 백색소음

> **Epic**: moyeogongbu
> **Status**: Complete
> **Layer**: Feature
> **Type**: UI
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-11-11

## Context

**GDD**: `design/game-brief.md`
**Requirement**: 회사 방과 공용 카페에 백색소음 (2026-11-10 사용자 결정: 빗소리와 키보드는 브라우저에서 합성, 카페 소리는 CC0 파일)

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none (React 19 + Vite 웹 앱) | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

## Acceptance Criteria

- [x] 공부 세션 줄의 "소리" 단추가 작은 창을 연다: 끄기, 빗소리, 키보드, 카페와 음량(0~100). 바깥을 누르거나 Esc로 닫는다.
- [x] 빗소리: 분홍 잡음 빗줄기(천천히 세졌다 약해짐)와 무작위 빗방울. 키보드: 사람 박자(단어 3~8타, 띄어쓰기, 가끔 줄바꿈 뒤 쉼)의 타자 소리와 아주 작은 방 소리. 모두 Web Audio로 합성한다.
- [x] 카페: Wikimedia Commons의 CC0 녹음(Marble Toast, "Cafe ambiance")에서 고른 60초 고리(`public/assets/sounds/cafe-loop.mp3`, 만드는 법 `tools/audio/cafe_loop.py`, 출처 `public/assets/sounds/README.md`). 카페를 처음 고를 때만 받는다.
- [x] 세 소리의 크기를 맞췄다: 음량 최대에서 빗소리 -24, 카페 -24, 키보드 -29 dBFS, 깨짐 없음 (시험이 지킨다).
- [x] 고른 소리와 음량은 이 브라우저에 기억해 다음에 방에 들어오면 다시 켠다. 브라우저가 소리를 막으면 첫 누름이나 키 입력 때 켠다. 방을 나가면 꺼진다.
- [x] 숨은 탭에서도 끊기지 않도록 숨으면 2.5초 앞까지 미리 짜 둔다.

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

## Test Evidence

`production/qa/evidence/story-012-ambience/`: ambience-panel-rain, ambience-on.
자동 테스트: `tests/ambience.test.mjs`(저장 설정, 음량 곡선, 타자 박자, 무음 건너뛰기, 방에서 고르고 기억하기, 세 소리 크기).

## Dependencies

- `production/epics/moyeogongbu/story-011-public-cafe.md`

## Files

- src/features/ambience/model/ambienceRules.ts, ambienceEngine.ts
- src/features/ambience/viewmodel/useAmbience.ts
- src/features/ambience/view/AmbienceControl.tsx, ambience.css
- src/features/session/view/StudySessionBar.tsx, src/features/rooms/view/LiveStudyRoom.tsx, src/features/guide/model/guide.ts
- public/assets/sounds/cafe-loop.mp3, public/assets/sounds/README.md, tools/audio/cafe_loop.py
- tests/ambience.test.mjs
