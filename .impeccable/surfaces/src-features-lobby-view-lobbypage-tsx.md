---
version: 1
slug: "src-features-lobby-view-lobbypage-tsx"
primary_target: "src/features/lobby/view/LobbyPage.tsx"
related_targets: []
---

Scope: `/lobby`, operate mode. Visitor: 로그인한 사용자가 집(내 방)에서 하루를 시작하고 오늘 갈 곳(회사, 스터디카페, 학교)을 고른다.

## Direction contract

THESIS: 로비는 집, 내 방이다. 패널 격자 대신 방 안 물건(모니터, 메모지, 코르크판, 휴대폰)이 기능을 가진다. 사무실이 아니라 목적지로 떠나기 전의 출발점이다.
OWN-WORLD: 크림 벽지와 나무 마루를 도트 타일(art-src/home)로 1배 깐 방 장면 액자와, 그 둘레의 따뜻한 짙은 갈색 바탕. 물건은 도트 9조각 틀(art-src/lobby): 검은 베젤 모니터, 노란 메모지, 코르크판과 압정, 둥근 휴대폰. 서체 Gowun Dodum, 강조색 라벤더.
STORY: 꾸민 내 캐릭터가 내 방에 서서 오늘 할 일과 친구 상태를 보여 준다. 사용자는 모니터에서 오늘 갈 곳을 고른다(회사 방으로 출근, 스터디카페, 학교는 준비 중).
FIRST VIEWPORT: 왼쪽에 방 장면 액자(770×455)가 있고 캐릭터와 말풍선, 왼쪽 위 명패(이름의 방, 실제 날짜, 캐릭터 꾸미기)가 그 위에 올라간다. 액자 아래에 모니터(오늘 어디로 갈까, 주요 행동)와 메모지(할 일). 오른쪽 열에 코르크판(공지)과 휴대폰(친구). 1280×720에서 모니터가 접힘선 위에 보인다.
FORM: 내 방 디오라마 (2026-10-30 내 자리 디오라마를 2026-10-31 집으로 옮김), 시드 af6c9a2c.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- 방 장면은 캐릭터 도트 세션이 그릴 "내 방" 그림(768×448 안팎)이 나오면 타일 임시 장면을 교체한다.
- 학교 목적지는 준비 중이다. 아트가 생기면 연다.
