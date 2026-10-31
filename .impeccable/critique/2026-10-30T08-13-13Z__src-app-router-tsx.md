---
target: 모여공부 웹앱 전체 UI/UX (2차)
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:D:\\toy\\moyeogongbu\\src\\app\\router.tsx"
target_fingerprint: "sha256:dd2e59bc4d6b150b17adc6f23aa5ee44d1406ad7f6c5c575570e7dc6abeb78db"
target_path: "D:\\toy\\moyeogongbu\\src\\app\\router.tsx"
timestamp: 2026-10-30T08-13-13Z
slug: src-app-router-tsx
---
Method: dual-agent (A: design review · B: detector+browser evidence)
Target: 모여공부 웹앱 전체 (2차, 로비 재설계와 P2까지 수정 후)

## Design Health Score: 22/40 (Acceptable), 이전 21/40
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | 우편함 미수령 표시가 aria-label에만 있음 (TopBar.tsx:28-30). 방 입장 직후 상태 "쉬는 중" |
| 2 | Match System / Real World | 3 | 출근, 퇴근, 근무, 시급 은유가 일관됨 |
| 3 | User Control and Freedom | 2 | 퇴근 걷는 동안 모든 버튼 비활성, 취소 불가 |
| 4 | Consistency and Standards | 1 | 방 그림 속 가짜 UI(1,250코인, 25:00), 화면 세계 셋(로비 사무실, 서재 배경 패널, 회색 로그인 카드) |
| 5 | Error Prevention | 3 | 구매 확인 단계 좋음. 계정 삭제가 로그아웃 옆 |
| 6 | Recognition Rather Than Recall | 2 | 상점과 꾸미기에 아이템 그림 없음 |
| 7 | Flexibility and Efficiency | 2 | 단축키 없음, 마지막 좌석으로 바로 가기 없음 |
| 8 | Aesthetic and Minimalist Design | 2 | 로비 훌륭, 방은 툴바, 그림 속 UI, 하단 바 세 겹 |
| 9 | Error Recovery | 2 | 방 만들기 빈 입력에 브라우저 기본 툴팁 (MyRoomList.tsx:61,81) |
| 10 | Help and Documentation | 3 | 가이드 5단계와 방 안내 좋음, 처음 온 사람 유도는 없음 |

## Priority Issues
1. [P1] 우편함 미수령 표시 없음: TopBar.tsx:28-30, .notification i (styles.css:124) 재사용
2. [P1] 토스트가 꾸미기 저장과 상점 이동 버튼을 가림: styles.css:1158-1162
3. [P1] 상점과 꾸미기 아이템 그림 없음: ITEM_ASSETS 전부 placeholder, 캐릭터 도트 세션의 아이템 레이어 아트 대기
4. [P2] 가이드 대비 2.48(번호 .guide > div > strong, styles.css:1082)과 4.11(본문 .guide p, styles.css:1090), 줄 121자. 좌석 "내 자리" 10px (study.css:236). 지난 대비 작업의 측정 대상에서 빠졌던 곳
5. [P2] 회사 방 그림 속 가짜 UI와 1280×720 접힘: 사용자가 원본 그림 유지로 결정한 항목. 무대 높이 제한과 표시 범위는 재결정 필요

## Detector
CLI(축소 모드): 고전 안티패턴 1건 side-tab styles.css:349 (옛 로비 레벨 바, 미사용 CSS, 오탐). design-system 216건(색 149, 글자 42, 모서리 25)은 DESIGN.md 토큰과의 차이 표시.
Overlay: login, welcome 0. 셸 dark-glow 3건(inset 음영, 오탐). guide low-contrast 9 + line-length 1. roomSeated undersized 10px.
측정: 1536/1280/1024 가로 넘침 0, 이름 없는 컨트롤 0, alt 없음 0, 콘솔 오류 0, focus-visible 정상. 390은 min-width 980 (PC 전용 의도).

## Persona Red Flags
Jordan: 환영 화면에 캐릭터 없음, 방 입장 직후 "쉬는 중"인데 앉아야 공부가 시작된다는 안내가 약함, 그림 속 "시작하기" 무반응.
Sam: 로비 물건 호버와 포커스가 2px 이동뿐 (lobby.css desk-object), 좌석 키보드 접근 별도 확인 필요.
Casey: 390에서 상단 지갑과 버튼이 화면 밖, "PC에서 열어 주세요" 안내 없음.

## Minor
입구 이름표와 "나가기" 표지 겹침, 1536 로비 하단 빈 벽, 기록 빈 상태가 0분 막대 7개, 친구 코드 입력칸 작음, 처음 꾸미기 미리보기 색 확인 필요, 사이드바 로비 항목 없음.

## Questions
그림 속 타이머와 할 일 위치에 진짜 기능을 겹쳐 그림을 살릴 수 있나? 상점이 사무실 매점, 기록이 출근부라면 종이 패널 층이 필요한가? 퇴근 정산이 로비만큼 공들여졌나?
