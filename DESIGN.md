---
name: 모여공부
description: 도트 집에서 오늘 갈 곳을 골라 친구와 함께 공부하는 PC 웹 스터디 서비스
colors:
  app-backdrop: "#45424c"
  paper: "#f4e8d5"
  panel-cream: "#f5e9d7"
  topbar-tan: "#ecddc8"
  sidebar-tan: "#e4d3bc"
  ink: "#24231f"
  walnut-line: "#50483f"
  muted-umber: "#86735e"
  field-cream: "#fff8e8"
  field-line: "#b6a084"
  sage: "#6c7b61"
  sage-deep: "#49533f"
  sage-active: "#aeb29a"
  lavender-focus: "#9b70bc"
  lavender-level: "#ac83cf"
  coral: "#d88777"
  coin-gold: "#f1b854"
  lobby-wall: "#2b201c"
  wall-ink: "#f3e7d3"
  frame-black: "#140e0c"
  wallpaper-cream: "#f1e2c8"
  baseboard-walnut: "#7a4d2b"
  floor-edge: "#b47849"
  desk-wood: "#c8925a"
  notebook-paper: "#fbf5e8"
  margin-red: "#e8a79c"
  sticker-white: "#fffaf0"
  memo-yellow: "#f6e39c"
  memo-yellow-light: "#fbeeb8"
  nameplate-wood: "#d0a067"
  nameplate-ink: "#3b2416"
  nameplate-hint: "#4a2f1d"
  plate-cream: "#f3e5cc"
  plate-ink: "#3b2c22"
  go-lavender: "#7d55a0"
  go-lavender-shade: "#5c3d78"
  wall-focus: "#b892d8"
  monitor-titlebar: "#3a4a55"
  monitor-screen: "#253038"
  monitor-row: "#2f3d47"
  screen-ink: "#eef3ef"
  screen-amber: "#f1c27d"
  memo-ink: "#3a2f22"
  phone-statusbar: "#e8d4be"
typography:
  brand:
    fontFamily: "Gowun Dodum, sans-serif"
    fontSize: "29px"
    letterSpacing: "1px"
  headline:
    fontFamily: "Gowun Batang, serif"
    fontSize: "29px"
  nameplate-name:
    fontFamily: "Gowun Batang, serif"
    fontSize: "22px"
    letterSpacing: "0.5px"
  page-sticker:
    fontFamily: "Gowun Dodum, sans-serif"
    fontSize: "22px"
  title:
    fontFamily: "Gowun Dodum, sans-serif"
    fontSize: "18px"
    letterSpacing: "0.5px"
  object-title:
    fontFamily: "Gowun Dodum, sans-serif"
    fontSize: "16px"
    letterSpacing: "0.3px"
  body:
    fontFamily: "Gowun Dodum, sans-serif"
    fontSize: "16px"
    lineHeight: 1.6
  body-small:
    fontFamily: "Gowun Dodum, sans-serif"
    fontSize: "14px"
    lineHeight: 1.6
  label:
    fontFamily: "Gowun Dodum, sans-serif"
    fontSize: "13px"
  tag:
    fontFamily: "Gowun Dodum, sans-serif"
    fontSize: "12px"
rounded:
  none: "0"
  sm: "4px"
  md: "6px"
  shell: "12px"
  panel: "13px"
  round: "50%"
spacing:
  hairline: "4px"
  tight: "8px"
  panel-y: "13px"
  panel-x: "16px"
  scene-stack: "18px"
  lobby-gutter: "22px"
  side-stack: "26px"
  page: "30px"
components:
  button-primary:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  button-primary-danger:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  button-secondary:
    backgroundColor: "{colors.field-cream}"
    textColor: "{colors.sage-deep}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  panel:
    backgroundColor: "{colors.panel-cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "13px 16px"
  input-field:
    backgroundColor: "{colors.field-cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px"
  nav-item:
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "102px"
  nav-item-active:
    backgroundColor: "{colors.sage-active}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
  tag:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.paper}"
    typography: "{typography.tag}"
    rounded: "{rounded.sm}"
    padding: "4px 5px"
  notebook-page:
    backgroundColor: "{colors.notebook-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "44px 30px 34px 64px"
  page-sticker:
    backgroundColor: "{colors.sticker-white}"
    textColor: "{colors.ink}"
    typography: "{typography.page-sticker}"
    rounded: "{rounded.none}"
    padding: "6px 14px"
  postit-back:
    backgroundColor: "{colors.memo-yellow}"
    textColor: "{colors.memo-ink}"
    rounded: "{rounded.none}"
    padding: "10px 14px 12px"
  postit-back-hover:
    backgroundColor: "{colors.memo-yellow-light}"
  wooden-nameplate:
    backgroundColor: "{colors.nameplate-wood}"
    textColor: "{colors.nameplate-ink}"
    typography: "{typography.nameplate-name}"
    rounded: "{rounded.none}"
    padding: "0 4px"
  wall-memo:
    backgroundColor: "{colors.memo-yellow}"
    textColor: "{colors.memo-ink}"
    typography: "{typography.body-small}"
    rounded: "{rounded.none}"
    padding: "0 4px"
  desk-go:
    backgroundColor: "{colors.go-lavender}"
    textColor: "{colors.field-cream}"
    rounded: "{rounded.none}"
    padding: "7px 14px"
  monitor-room-row:
    backgroundColor: "{colors.monitor-row}"
    textColor: "{colors.screen-ink}"
    rounded: "{rounded.none}"
    padding: "8px 10px"
  monitor-room-row-hover:
    backgroundColor: "{colors.monitor-titlebar}"
  board-note:
    backgroundColor: "{colors.plate-cream}"
    textColor: "{colors.plate-ink}"
    typography: "{typography.body-small}"
    rounded: "{rounded.none}"
    padding: "9px 12px 9px 10px"
  phone-screen:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    width: "240px"
---

# Design System: 모여공부

## Overview

**Creative North Star: "집에서 나서는 도트 공부길"**

모여공부의 화면은 앱이 아니라 집이다. 로비는 내 방이고, 사용자는 메뉴를 고르는 대신 내 방 책상에서 "오늘 어디로 갈까"를 고른다. 회사 방, 스터디카페, 학교는 집에서 골라 나서는 목적지이고, 출근이나 퇴근 같은 회사 말은 회사 안에서만 쓴다. 공통 화면(상점, 기록, 친구, 꾸미기, 가이드 등)은 내 책상 위에 펼친 스프링 노트이고, 로그인과 환영은 집 현관이다. 앱 전체를 감싸는 껍데기(위쪽 바, 왼쪽 서랍장 같은 사이드바)는 따뜻한 문구점 재질이고, 그 안의 장면은 도트 그림이다. 모든 층은 같은 갈색 잉크와 같은 서체로 묶인다.

이 시스템은 지금 네 가지 재질로 존재한다. **종이 패널 층**(패널, 모달, 카드, 입력칸)은 크림 종이 위에 짙은 호두색 선과 살짝 둥근 모서리를 쓰고, 노트 안이나 현관 위에 놓여도 같은 모양을 지킨다. **집 층**은 장면의 바탕이다: 로비의 내 방(256×152 도트 방, 캐릭터와 함께 3배), 공통 페이지의 책상 나무와 스프링 고리(2배), 노트 종이, 현관의 벽지와 마루(2배). **책상 물건 층**(로비)은 내 방 장면 둘레의 짙은 벽 위에 기능 하나하나를 물건(검은 베젤 모니터, 노란 메모지, 코르크판, 둥근 휴대폰)으로 그린다. 물건과 명패의 틀은 손으로 찍은 도트 9조각이고 모서리는 CSS 둥글림이 아니라 그림 속 계단이다. **목적지 층**(회사 방 화면)은 그곳만의 테마를 따르고 집 세계의 규칙을 덮어쓰지 않는다.

로비는 집 세계로 재설계 중이다(2026-10-31, AGENTS.md). 캐릭터는 꾸미기와 같은 레이어 부품이고, 배경 장면과 물건은 서로 분리된 부품이다. 내 방은 사용자가 고른 포근한 시안(6번) 구성의 256×152 도트 방이고, 빈 방 위에 가구와 소품을 갈아 끼울 수 있는 부품으로 얹는다(`tools/art/home-room.mjs`). 캐릭터가 방을 넉넉히 채우도록 방과 캐릭터를 함께 3배로 그린다.

**Key Characteristics:**
- 로비는 집, 내 방이다. 회사, 스터디카페, 학교는 집에서 고르는 목적지다
- 고양이 모티프와 따뜻한 갈색 잉크, 크림 종이, 나무 재질
- 서체는 Gowun Dodum 하나로 거의 모든 글을 쓰고, 페이지 제목과 나무 문패의 이름만 Gowun Batang
- 도트 그림은 정수 배율로만, 한 장면에는 한 배율. 로비 내 방은 3배, 로비 둘레 물건은 1배, 노트 페이지와 현관은 2배
- 그림자는 번지지 않고 바로 아래로 떨어진다
- 주요 행동색은 두 가지: 종이 층은 세이지, 책상 물건 층은 라벤더

## Colors

갈색 잉크와 크림 종이, 꿀색 나무가 바탕을 이루고, 세이지와 라벤더가 행동을, 산호와 금색이 작은 신호를, 노란 메모지가 손으로 붙인 표시를 맡는 따뜻한 집 팔레트다.

### Primary
- **세이지 잉크** (sage): 종이 패널 층의 주요 버튼, 확인, 저장, 구매. 짙은 세이지(sage-deep)가 그 테두리와 보조 버튼 글자다.
- **가기 라벤더** (go-lavender): 책상 물건 층의 주요 행동(모니터에서 목적지로 가는 단추, 방 만들기, 친구 추가). 아래쪽과 오른쪽에 짙은 라벤더(go-lavender-shade) 3px 안쪽 띠를 깔아 눌리는 도트 단추처럼 보이게 한다. 짙은 라벤더는 메모지 위 "캐릭터 꾸미기" 링크 글자색도 맡는다.

### Secondary
- **포커스 라벤더** (lavender-focus): 앱 전체의 키보드 포커스 테두리. 짙은 벽 위에서는 한 단계 밝은 벽 포커스(wall-focus)로 바꾼다.
- **레벨 라벤더** (lavender-level): 진행 막대 채움.

### Tertiary
- **산호** (coral): 공지 태그, 알림 점, 위험 버튼. 경고가 아니라 눈길을 끄는 작은 표시다.
- **코인 금색** (coin-gold): 코인 아이콘 채움. 모니터 화면 안에서는 호박색(screen-amber)이 같은 역할(아이콘, 인원 수, "내가 만든 방")을 한다.
- **메모 노랑** (memo-yellow): 손으로 붙인 종이. 로비 메모지와 명패 아래 날짜 메모, 노트의 "로비로 돌아가기" 포스트잇, 회사 방의 할 일 메모. 포스트잇을 가리키면 밝은 메모 노랑(memo-yellow-light)으로 바뀐다.

### Neutral
- **앱 바탕 자두회색** (app-backdrop): 껍데기 바깥 화면 바탕.
- **종이** (paper), **패널 크림** (panel-cream): 패널, 모달, 휴대폰 화면 안쪽.
- **위쪽 바 황갈** (topbar-tan), **사이드바 황갈** (sidebar-tan): 껍데기 재질.
- **잉크** (ink): 본문 글자. **호두색 선** (walnut-line): 패널과 껍데기 테두리, 물건 속 보조 글자.
- **흐린 고동** (muted-umber): 보조 문장, 안내, 메모지 점선.
- **입력 크림** (field-cream), **입력 선** (field-line): 입력칸과 보조 버튼. 입력 크림은 라벤더 단추의 글자색이기도 하다.
- **로비 벽** (lobby-wall), **벽 글자** (wall-ink): 내 방 장면 둘레, 물건이 놓인 짙은 벽과 그 위의 글자. 로비를 감싸는 장면 영역까지 같은 벽색으로 칠해 경계가 보이지 않게 한다.
- **액자 검정** (frame-black): 장면 액자 4px 테두리, 말풍선 꼬리 외곽선.
- **벽지 크림** (wallpaper-cream): 집 벽지 타일의 바탕색. 현관 화면 전체와 내 방 장면의 벽.
- **걸레받이 호두** (baseboard-walnut), **마루 가장자리** (floor-edge): 벽과 마루가 만나는 걸레받이 한 줄과 그 아래 빛 받은 마루 끝. 내 방은 6px과 2px, 현관은 2배로 12px과 4px.
- **책상 나무** (desk-wood): 공통 페이지 장면 바탕, 책상 상판 타일의 바탕색.
- **노트 종이** (notebook-paper), **여백선 분홍** (margin-red): 스프링 노트의 종이와 왼쪽 2px 여백선 하나.
- **스티커 흰색** (sticker-white): 노트 위 가장자리에 붙인 페이지 이름 스티커.
- **문패 나무** (nameplate-wood), **문패 잉크** (nameplate-ink), **문패 흐린 글자** (nameplate-hint): 내 방 벽과 현관 문에 건 나무 문패, 새긴 이름, 이름을 아직 쓰지 않았을 때의 안내 글자.
- **명패 크림** (plate-cream), **명패 잉크** (plate-ink): 코르크판 쪽지, 말풍선, 휴대폰 상태줄 글자.
- **모니터 화면** (monitor-screen), **모니터 줄** (monitor-row), **모니터 제목줄** (monitor-titlebar), **화면 글자** (screen-ink): 모니터 속 창. 화면은 어두운 청회색 셋을 깊이 순서로 쌓는다.
- **메모 잉크** (memo-ink): 메모지와 포스트잇 글자, 메모 제목 밑줄.
- **휴대폰 상태줄** (phone-statusbar): 휴대폰 맨 위 이름 줄.

### Named Rules
**The 장면 바탕 하나 Rule.** 장면의 바탕은 화면마다 하나다. 로비는 짙은 로비 벽, 공통 페이지는 책상 나무, 현관은 벽지. 크림과 노랑은 바탕이 아니라 그 위에 놓인 물건(노트, 패널, 문패, 메모지, 쪽지)의 재질로만 나온다.

**The 행동색 하나 Rule.** 한 층에는 주요 행동색이 하나다. 종이 층은 세이지, 책상 물건 층은 라벤더. 같은 화면에 두 주요 행동색을 나란히 두지 않는다.

## Typography

**Display Font:** Gowun Batang (with serif)
**Body Font:** Gowun Dodum (with sans-serif)

**Character:** 둥글고 손글씨 기운이 있는 Gowun Dodum이 거의 모든 글을 맡아 다정하고 느슨한 말투를 만들고, 붓 끝이 살아 있는 Gowun Batang은 페이지 제목과 나무 문패에 새긴 이름에서만 한 번 격식을 올린다. 둘 다 `@fontsource`로 앱에 싣는다.

### Hierarchy
- **Brand** (29px, 자간 1px): 위쪽 바의 서비스 이름. 그 자리에만.
- **Headline** (Gowun Batang, 29px): 노트 안 페이지의 큰 제목("공부하며 모은 코인으로 나를 꾸며요" 같은 첫 문장), 회사 방 제목.
- **Nameplate Name** (Gowun Batang, 22px, 자간 0.5px): 나무 문패에 새긴 내 이름. 뒤에 붙는 "의 방"은 16px Dodum으로 작게 둔다.
- **Page Sticker** (22px): 노트 위 가장자리에 붙인 페이지 이름 스티커(상점, 공부 기록 등).
- **Title** (18px, 자간 0.5px; 큰 패널은 21px): 패널 머리글, 모달 제목.
- **Object Title** (16px, 자간 0.3px): 책상 물건의 이름. 물건마다 제자리(모니터 창 제목줄, 휴대폰 상태줄 13px, 코르크판 제목 쪽지)에 놓인다.
- **Body** (16px, 줄 간격 1.6): 할 일, 목록 줄, 본문. 모달 문단은 줄 간격 1.9.
- **Body Small** (14px, 줄 간격 1.6): 빈 상태 문장, 날짜, 쪽지 내용, 말풍선, 꾸미기 링크.
- **Label** (13px): "회사 방 목록" 같은 작은 이동 링크, 모니터 속 목적지 묶음 이름, 보조 줄.
- **Tag** (12px): 공지 분류 태그.

### Named Rules
**The 한 목소리 Rule.** 화면 글은 Gowun Dodum이다. Gowun Batang은 페이지 제목과 문패에 새긴 이름에만 쓰고, 버튼, 라벨, 물건 이름, 스티커에는 쓰지 않는다.

**The 가운뎃점 없음 Rule.** UI 문구에 가운뎃점을 쓰지 않는다. 나열은 쉼표, 줄바꿈, 별도 요소로 나눈다. 예: "함께하는 회사, 6석, 초대 코드 TEAM26".

**The 끊지 않는 낱말 Rule.** 한국어 문장은 낱말 단위로 줄을 바꾼다(`word-break: keep-all`). 긴 영문과 숫자만 아무 곳에서나 끊을 수 있다.

## Layout

앱은 PC 전용이고 최소 너비 980px, 1280px 이상을 우선한다. 껍데기는 높이 63px 위쪽 바와 너비 145px 사이드바(1180px 이하 125px)이고, 나머지 영역이 장면이다. 장면 높이는 화면 높이에서 껍데기 높이 72px를 뺀 값을 최소로 채운다.

**로비 (내 방).** 두 열이다. 왼쪽 열(너비 778px 고정)은 장면 액자(내 방 256×152를 3배로 768×456, 액자 테두리 4px) 아래에 모니터("오늘 어디로 갈까")와 메모지를 1.25 : 1 비율로 나란히 둔다. 내 방은 양옆 벽이 비스듬히 보이는 방이다. 왼쪽에 책장 달린 책상과 바닥 화분, 가운데에 안락의자와 커튼 친 창문, 오른쪽에 협탁, 벽에 머리를 댄 침대, 협탁과 스탠드, 벽에는 액자와 선반을 둔다. 캐릭터는 러그 가운데(1배 좌표 발 128, 147)에 3배로 선다. 왼쪽 위 벽(24px 안쪽)에 나무 문패를 걸고 그 바로 아래에 날짜와 꾸미기 링크를 적은 노란 메모를 붙인다. 오른쪽 열(300px 기준, 280px부터 440px까지)은 코르크판과 휴대폰(너비 240px, 최소 높이 400px)을 세로로 쌓는다. 열 사이와 물건 사이는 22px, 장면과 물건 줄 사이 18px, 오른쪽 열 물건 사이 26px. 1240px 이하에서는 오른쪽 열이 장면 아래로 내려가 778px 너비 한 줄에 코르크판과 휴대폰이 나란히 선다.

**공통 페이지 (책상 위 노트).** 장면 전체에 책상 나무 타일을 2배로 깔고, 최대 너비 1150px, 좌우 4% 여백 안에 노트 한 권을 펼친다. 노트 위 40px은 고리 줄 자리이고, 고리 줄은 노트 위 가장자리에 반쯤 걸쳐(위로 16px) 좌우 24px 안쪽으로 늘어선다. 왼쪽 40px에 여백선 하나, 본문 안쪽 여백은 위 44px, 오른쪽 30px, 아래 34px, 왼쪽 64px(여백선 바깥). 왼쪽 위(56px)에 페이지 이름 스티커, 오른쪽 위에 "로비로 돌아가기" 포스트잇을 대칭으로 붙인다. 가로줄은 넣지 않는다.

**현관 (로그인, 환영).** 장면 전체에 벽지를 2배로 깔고 화면 아래 18vh에 걸레받이와 마루를 2배로 깐다. 가운데에 너비 480px 세로 묶음(사이 8px): 환영 화면은 위에서부터 문패(240px부터 340px), 문 앞에 선 캐릭터(2배), 이름 입력 패널. 문패에는 입력칸에 쓰는 이름이 그대로 새겨진다.

**목적지 (회사 방).** 회사 방 그림과 오른쪽 할 일 메모 열(264px, 좁은 화면 208px, 사이 14px)의 두 열. 회사 그림은 확정 이미지에서 방 영역만 잘라 보인다.

**The 정수 배율 Rule.** 도트 그림(방, 타일, 캐릭터, 물건 틀)은 1배, 2배처럼 정수 배율로만 그린다. 화면 크기에 맞춰 늘이거나 줄이지 않는다. 장면이 좁으면 그림을 줄이지 않고 잘라 쓴다.

**The 한 장면 한 배율 Rule.** 한 장면 안의 도트 그림은 모두 같은 배율이다. 로비 내 방은 방 그림과 캐릭터를 함께 3배로 그리고, 장면 밖 둘레 물건(모니터, 메모지, 코르크판, 휴대폰)은 1배 틀이다. 노트 페이지는 스프링 고리를 2배로 그리므로 책상 나무도 2배로 깐다. 현관은 캐릭터를 2배로 세우므로 벽지, 마루, 걸레받이, 문패까지 모두 2배로 맞춘다.

## Elevation & Depth

깊이는 번지지 않는 단단한 그림자로 만든다. 도트 세계에는 흐린 그림자가 없으므로 바깥으로 떨어지는 그림자는 모두 흐림 0이다. 집 세계(로비, 노트, 현관)는 "빛은 위에서 온다"는 규칙으로 그림자를 바로 아래로 떨어뜨리고, 물건이 클수록, 배율이 클수록 조금 더 길게 떨어진다. 물건 틀과 타일 그림 자체도 같은 빛을 따라 윗변과 왼변은 밝게, 아랫변과 오른변은 어둡게 칠해져 있다(마루 끝의 밝은 띠가 그 예다). 먼저 자리 잡은 종이 패널은 오른쪽 아래로 비스듬히 떨어지는 그림자를 그대로 쓴다. 껍데기와 종이의 안쪽 은은한 그늘은 재질의 결이지 높이가 아니다.

### Shadow Vocabulary
- **물건 그림자** (`filter: drop-shadow(0 6px 0 #0007)`): 로비의 모든 물건, 문패, 메모, 장면 액자. 그림의 투명 칸을 따라가도록 box-shadow가 아니라 drop-shadow로 준다.
- **노트 그림자** (`box-shadow: 0 8px 0 0 #0004`): 책상 위에 펼친 노트 종이.
- **포스트잇 그림자** (`box-shadow: 0 4px 0 0 #0004`): 노트에 붙인 "로비로 돌아가기" 포스트잇.
- **스티커 그림자** (`box-shadow: 0 0 0 1px #e1d3bb, 0 3px 0 0 #0002`): 페이지 이름 스티커. 1px 가장자리 선과 얕은 아래 그림자.
- **현관 문패 그림자** (`filter: drop-shadow(0 8px 0 #0004)`): 2배 장면의 문패.
- **쪽지 그림자** (`box-shadow: 0 3px 0 0 #0004`): 코르크판에 꽂힌 쪽지와 제목.
- **도트 단추 띠** (`box-shadow: inset -3px -3px 0 0 #5c3d78`): 라벤더 행동 단추의 눌림 면.
- **패널 그림자** (`box-shadow: inset 0 0 0 2px #e7d5bc, 3px 4px 0 #342c3540`): 종이 패널. 안쪽 2px 크림 띠가 종이 가장자리다.
- **떠 있는 알림** (`box-shadow: 4px 4px #30283744`): 토스트.
- **세이지 단추 띠** (`box-shadow: inset 2px 2px #98a184, 0 2px #d1b899`): 세이지 주요 버튼의 빛 받은 면과 받침.

### Named Rules
**The 위에서 오는 빛 Rule.** 집 세계에 새로 그리는 물건과 장면 요소는 빛이 위에서 온다. 그림은 윗변이 밝고 아랫변이 어둡고, 그림자는 오른쪽이 아니라 바로 아래로 떨어진다.

**The 흐림 없는 그림자 Rule.** 바깥으로 떨어지는 그림자에는 흐림 값을 주지 않는다. 흐림은 안쪽 재질 그늘과 모달 뒤 배경(3px)에만 있다.

## Shapes

층마다 모서리 언어가 다르다. 종이 패널 층은 살짝 둥글다: 작은 요소 4px, 카드와 선택지 6px, 위쪽 바 12px(아래쪽 8px), 패널 13px, 아바타와 알림 점은 원. 테두리는 2px에서 3px의 짙은 호두색 실선이다.

집 층과 책상 물건 층은 CSS 둥글림을 쓰지 않는다(0). 노트 종이, 스티커, 포스트잇은 곧은 사각형이고 테두리도 없다. 물건과 문패의 모양은 전부 그림이 맡는다: 48×48 그림을 16px 모서리 9조각으로 잘라 `border-image`로 건다(로비는 1배, 현관 문패는 2배). 모서리는 투명 칸을 비운 계단이고(휴대폰은 계단이 크다), 바깥 1px 외곽선, 2px 빛 띠, 2px 그늘 띠, 안쪽 홈 순서로 찍는다. 벽지(16×16), 마루와 책상(48×16), 스프링 고리(16×16), 압정(16×16), 테이프(48×16), 모니터 받침(64×32), 코르크 타일(16×16)은 16px 격자 위의 타일과 소품이다.

손으로 붙인 종이만 살짝 기운다: 코르크판 쪽지(-1.5도에서 1도), 페이지 이름 스티커(-1.5도), 포스트잇(2도). 노트 본문, 패널, 문패는 기울이지 않는다.

**The 그림이 모서리 Rule.** 책상 물건과 문패에 `border-radius`를 주지 않는다. 둥근 휴대폰도 둥근 모서리는 그림 속 계단이다.

## Components

### Buttons
도톰하고 눌리는 도트 단추. 누르면 1px 내려앉고(`translateY(1px)`), 가리키면 밝기만 6% 올린다.
- **Shape:** 종이 층은 살짝 둥근 모서리(4px에서 5px), 책상 층은 각진 모서리(0).
- **Primary:** 세이지 바탕, 종이 글자, 짙은 세이지 2px 테두리, 왼쪽 위 빛 띠와 아래 2px 받침, 안쪽 여백 10px 18px.
- **Danger:** 같은 모양에 산호 바탕.
- **Secondary:** 입력 크림 바탕, 입력 선 2px 테두리, 짙은 세이지 글자.
- **Text:** 짙은 세이지 밑줄 글자, 14px.
- **Desk Go (책상 층 주요 행동):** 라벤더 바탕, 입력 크림 글자 16px, 아래와 오른쪽 3px 짙은 라벤더 띠. 모니터에서 목적지로 가는 단추(회사에서는 "출근"), 방 만들기, 친구 추가에 쓴다.
- **Hover / Focus:** 포커스는 3px 라벤더 실선, 4px 띄움(벽 위에서는 밝은 라벤더, 3px 띄움). 전환은 0.15초.

### Chips
- **Style:** 공지 태그. 산호 바탕에 종이 글자 12px, 최소 너비 62px, 4px 둥근 모서리. 분류마다 하늘색, 모래색 변형이 있다.
- **State:** 코르크판 안에서는 둥글림 0, 연한 모래 바탕(#ead9bb)과 갈색 글자로 쪽지 재질에 맞춘다.

### Cards / Containers
- **Corner Style:** 13px.
- **Background:** 패널 크림, 머리글은 반투명 황갈 띠와 2px 아래 선.
- **Shadow Strategy:** 패널 그림자(Elevation 참조).
- **Border:** 3px 호두색 실선과 안쪽 2px 크림 띠.
- **Internal Padding:** 13px 16px, 큰 페이지 패널 30px, 모달 23px.

### Inputs / Fields
- **Style:** 입력 크림 바탕, 입력 선 2px 테두리, 4px 모서리, 안쪽 여백 12px.
- **Checkbox:** 24px 정사각, 2px 짙은 테두리와 오른쪽 아래 2px 안쪽 그늘. 체크하면 세이지 바탕에 빛 띠와 그늘 띠가 생기는 도트 단추가 된다. 메모지 안에서는 22px, 둥글림 0, 아이보리 바탕이다.
- **Error / Disabled:** 비활성은 불투명도 0.6. 오류 문장은 패널 아래 별도 줄.

### Navigation
- **Style:** 왼쪽 서랍장 같은 사이드바에 세로 칸이 쌓인다. 칸은 높이 102px, 48px 아이콘 위에 17px 이름. 첫 칸이 집(스터디룸)이다.
- **States:** 가리키면 연한 세이지 회색, 현재 칸은 세이지 회색 바탕에 위 왼쪽 밝은 안쪽 띠와 아래 오른쪽 어두운 안쪽 띠로 눌린 단추처럼 보인다.
- **Topbar:** 서비스 이름, 코인 지갑, 알림(산호 점), 프로필. 이름 옆 고양이 아이콘에 2px 단단한 그림자.
- **로비로 돌아가기:** 공통 페이지에서는 노트 오른쪽 위에 붙인 노란 포스트잇이다(메모 노랑, 메모 잉크, 둥글림 0, 2도 기울기, 가리키면 밝은 노랑).

### 스프링 노트 (공통 페이지 틀)
상점, 기록, 친구, 꾸미기, 가이드 같은 공통 페이지는 모두 같은 틀을 쓴다. 책상 나무 위에 노트 종이 한 장, 위 가장자리에 스프링 고리 줄, 왼쪽에 분홍 여백선 하나, 왼쪽 위에 페이지 이름 스티커(스티커 흰색, 22px, 아이콘과 이름), 오른쪽 위에 포스트잇. 노트 안의 내용은 종이 패널 층(카드, 세이지 버튼, 입력칸)을 그대로 쓴다.

### 나무 문패와 벽 메모
- **문패:** 같은 물건이 두 곳에 걸린다. 현관에서는 환영 화면 위쪽 문에 걸려 입력 중인 이름을 새기고(2배, 테두리 24px), 로비에서는 내 방 왼쪽 위 벽에 걸린다(1배, 테두리 12px). 이름은 Gowun Batang 22px 문패 잉크, 뒤의 "의 방"은 16px. 로비 문패 끝에는 이름 바꾸기 연필 단추가 있다. 이름이 비면 16px 문패 흐린 글자로 안내한다.
- **벽 메모:** 로비 문패 바로 아래에 붙인 노란 메모(메모 9조각, 1배). 실제 날짜(14px)와 짙은 라벤더 "캐릭터 꾸미기" 링크.

### 책상 물건 (Desk Object)
로비의 기능 입구. 물건 하나가 기능 하나다(모니터는 오늘 갈 곳, 메모지는 할 일, 코르크판은 공지, 휴대폰은 친구). 공통 구조는 머리(이름과 작은 이동 링크), 몸, 발이며 이름은 늘 보인다. 가리키거나 포커스가 들어오면 물건이 2px 떠오르고(0.2초, 감속 곡선) 장면 속 캐릭터가 그 물건 쪽으로 몸을 돌린다.
- **모니터 ("오늘 어디로 갈까"):** 검은 베젤 틀 16px, 화면 안 제목줄(모니터 제목줄 색)에 이름. 어두운 화면에 목적지별 묶음 이름(13px)과 방 줄. 줄은 아이콘(호박색), 방 이름, 인원, 오른쪽 라벤더 단추. 그 아래 다른 목적지(스터디카페, 학교) 줄과 방 만들기. 아래에 받침 그림.
- **메모지:** 노란 종이 틀(오른쪽 아래 접힘), 위 가운데 테이프 그림. 이름 아래 2px 잉크 밑줄, 할 일 줄 사이는 1px 점선, 마지막 줄이 "할 일 추가". 몸은 210px에서 스크롤. 회사 방의 할 일 열도 같은 메모 틀을 쓴다.
- **코르크판:** 나무 틀 16px 안에 코르크 타일을 반복. 제목과 공지가 압정으로 꽂힌 명패 크림 쪽지이고, 짝수 쪽지는 반대로 기운다. 공지 내용은 두 줄에서 자른다.
- **휴대폰:** 계단 모서리 본체, 위 스피커와 아래 홈 바 띠. 상태줄에 이름, 화면은 종이 바탕. 친구가 없으면 고양이 아이콘과 "친구 추가" 라벤더 단추.

### 말풍선과 캐릭터
- **말풍선:** 캐릭터 머리 위 크림 틀(테두리 8px, 그림 16px을 반씩 걸침), 최대 너비 240px, 14px, 꼬리는 크림 계단 두 칸과 검은 외곽선. 0.35초 동안 아래에서 6px 올라오며 나타난다.
- **캐릭터 숨쉬기:** 2.4초마다 1px 올라갔다 내려오는 계단식(`steps(1)`) 움직임. 움직임 줄이기 설정에서는 숨쉬기, 말풍선 등장, 물건 떠오름을 모두 끈다.

## Do's and Don'ts

### Do:
- **Do** 도트 그림을 정수 배율로만 그리고 `image-rendering: pixelated`를 건다.
- **Do** 한 장면 안의 도트는 한 배율로 맞춘다. 로비 내 방은 3배, 노트 페이지와 현관은 2배.
- **Do** 새 물건 틀과 문패는 48×48 9조각, 16px 모서리로 찍는다. 타일과 소품은 16px 격자에 맞춘다.
- **Do** 새 그림은 빛이 위에서 오게 칠하고, 그림자는 흐림 없이 바로 아래로(`drop-shadow(0 6px 0 #0007)`) 떨어뜨린다.
- **Do** 반투명 픽셀은 실루엣 가장자리(완전 투명 픽셀과 맞닿은 곳)에만 쓰고 안쪽은 불투명으로 둔다.
- **Do** 캐릭터 새 원본은 56×72, 회사 방 원본은 672×432로 그리고 둘 다 화면에 1배로 그린다(AGENTS.md 기준). 내 방 원본은 256×152이고 캐릭터와 함께 3배로 그린다.
- **Do** 새 공통 페이지는 스프링 노트 틀에 넣고, 페이지 이름은 스티커로, 로비로 가는 길은 포스트잇으로 둔다.
- **Do** 종이 패널 층의 주요 행동은 세이지, 책상 물건 층의 주요 행동은 라벤더로 한다.
- **Do** 벽 위의 글자와 포커스는 밝은 쪽(벽 글자, 벽 포커스)으로 바꿔 대비를 지킨다.
- **Do** 움직임 줄이기 설정에서 반복과 등장 움직임을 모두 끈다.

### Don't:
- **Don't** 로비를 사무실로 그리거나 부르지 않는다. 로비는 집, 내 방이다. 출근, 퇴근 같은 회사 말은 회사 안에서만 쓴다.
- **Don't** 도트 그림을 1.5배나 화면 맞춤 비율로 늘이지 않는다.
- **Don't** 생성 이미지나 자동 변환 결과를 손 보정 없이 화면에 쓰지 않는다. 회사 방 원본 파일은 바이트 하나도 바꾸지 않는다.
- **Don't** 책상 물건과 문패에 `border-radius`나 CSS 테두리로 모양을 흉내 내지 않는다. 모양은 그림이 맡는다.
- **Don't** 바깥으로 떨어지는 그림자에 흐림 값을 주지 않는다.
- **Don't** 노트 종이에 가로줄을 긋지 않는다. 여백선 하나면 충분하다.
- **Don't** UI 문구에 가운뎃점을 쓰지 않는다.
- **Don't** 버튼, 라벨, 물건 이름, 스티커에 Gowun Batang을 쓰지 않는다.
- **Don't** 페이지 제목 위에 영문 대문자 머리말을 새로 얹지 않는다.
- **Don't** 확정된 로비의 배치와 디자인을 바꾸지 않는다. 로비는 문구만 다듬는다.
