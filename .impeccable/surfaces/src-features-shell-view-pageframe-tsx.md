---
version: 1
slug: "src-features-shell-view-pageframe-tsx"
primary_target: "src/features/shell/view/PageFrame.tsx"
related_targets: ["src/features/account/view/AuthFrame.tsx"]
---

Scope: 공통 페이지 틀(`PageFrame`)을 쓰는 8개 화면(스터디룸 목록, 카페, 테마방, 꾸미기, 상점, 기록, 친구, 가이드)과 `AuthFrame`(로그인, 환영). operate mode. 페이지 안 내용 배치는 바꾸지 않는다.

## Direction contract

THESIS: 공통 페이지는 집, 내 책상 위에 펼친 스프링 노트 한 권이다. 크림 종이 패널을 서재 그림 위에 띄우던 기본 틀을 버린다.
OWN-WORLD: 나무 책상 상판 도트 타일(art-src/home/desk.png, 1배) 바탕, 그 위에 크림 노트 종이와 위쪽 가장자리를 따라 늘어선 스프링 고리(spiral-ring.png), 노트 왼쪽의 빨간 여백선 하나. 가로줄은 넣지 않는다. 페이지 이름은 손으로 붙인 스티커, 로비로 가는 길은 노란 포스트잇. 로그인과 환영은 벽지와 마루의 집 현관, 환영은 나무 문패(nameplate.png) 아래 내 캐릭터.
STORY: 로비(내 방)에서 책상 위 노트를 펼쳐 상점, 기록, 친구 같은 일을 본다. 처음 온 사람은 집 현관에서 로그인하고, 이름을 적으면 방문 문패에 바로 새겨진다.
FIRST VIEWPORT: 책상 나무가 화면을 채우고 노트가 그 위 폭 대부분을 차지한다. 노트 위 가장자리에 고리가 늘어서고, 왼쪽 위 스티커(페이지 이름), 오른쪽 위 포스트잇(로비로 돌아가기). 환영 화면은 위에 문패와 캐릭터, 아래에 이름 입력.
FORM: 책상 위 스프링 노트, 재뽑기 1회차 리드, 시드 2835e04d.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- 집 현관 그림은 캐릭터 도트 세션이 그리면 로그인 화면에 액자로 건다.
- 페이지별 비유(내용을 여러 장으로 나누기)는 2단계.
