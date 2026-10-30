---
target: 모여공부 웹앱 전체 UI/UX
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:D:\\toy\\moyeogongbu\\src\\app\\router.tsx"
target_fingerprint: "sha256:dd2e59bc4d6b150b17adc6f23aa5ee44d1406ad7f6c5c575570e7dc6abeb78db"
target_path: "D:\\toy\\moyeogongbu\\src\\app\\router.tsx"
timestamp: 2026-10-30T05-19-54Z
slug: src-app-router-tsx
---
Method: dual-agent (A: design review · B: detector+browser evidence)
Target: 모여공부 웹앱 전체 (router 기준 로그인, 환영, 로비, 스터디룸 목록, 회사 방, 카페, 꾸미기, 상점, 기록, 친구, 가이드)

## Design Health Score: 21/40 (Acceptable)
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | 회사 방 그림 속 가짜 코인 1,250과 실제 340이 함께 보임. 상태줄이 넓은 녹색 상자 오른쪽 끝에 몰림 |
| 2 | Match System / Real World | 3 | 출근, 휴게실, 퇴근 비유 좋음. 로비 달력이 10/14 TUE로 그림에 고정 |
| 3 | User Control and Freedom | 3 | Esc 닫기, 뒤로가기, 로비 복귀 정상 |
| 4 | Consistency and Standards | 1 | 방 그림에 타이틀바, 25:00 타이머, 할 일, 음악 플레이어가 그려져 진짜 UI와 이중. 로비 아바타와 도트 캐릭터 외형 다름 |
| 5 | Error Prevention | 2 | 환불 불가 아이템을 확인 없이 1클릭 구매. 환영 화면 시작 버튼 비활성 이유 없음 |
| 6 | Recognition Rather Than Recall | 2 | 상점 아이템이 아이콘 자리표시뿐. 반응 이모지 버튼 라벨 없음 |
| 7 | Flexibility and Efficiency | 2 | 좌석 이동이 클릭 의존, 단축키 없음 |
| 8 | Aesthetic and Minimalist Design | 2 | 방 화면에 툴바, 상태줄 2개, 그림 속 가짜 UI, 무스타일 폼 줄이 겹침 |
| 9 | Error Recovery | 3 | 방 가득 참 등 서버 오류 안내 친절. 빈 초대 코드는 브라우저 기본 툴팁 |
| 10 | Help and Documentation | 1 | 가이드 3단계, 낡은 내용. 방, 코인, 뽀모도로, 친구 설명 없음 |

## Priority Issues
1. [P0] 회사 방 배경 그림 안의 가짜 앱 UI (타이틀바, 코인 1,250, X 버튼, 25:00, 할 일, 음악). 실제 UI와 숫자가 어긋나고 눌러도 반응 없음. 원본 기준 이미지라 화면용 사본 크롭은 사용자 승인 필요. src/study/companyLayout.js:4, src/study/CompanyRoom.jsx:281
2. [P1] 로비 응원 말풍선이 사이드바 메뉴를 덮음 (1280: 공부 기록, 1024: 친구 목록). styles.css:720-732, LobbyPage.tsx:199. 로비 확정 디자인이라 위치 조정만 제안.
3. [P1] 방 하단 실시간 줄이 무스타일 기본 폼 (친구 초대, 이모지 반응, 지금 하는 일 select, 13px 체크박스, 공개/저장). 1536×1024에서 첫 화면 밖. study.css:387-410, RoomLiveBar.tsx:78, RoomInviteButton.tsx:25
4. [P2] 상점 미리보기 없음 + 확인 없는 즉시 구매. 가격 대비 3.3:1, 구매 버튼 4.19:1. ShopPage.tsx:9,61
5. [P2] 가운뎃점 규칙 위반 CafePage.tsx:25, 가이드 내용 낡음 guide.ts:15

## Detector
CLI: side-tab 1건 (styles.css:349, 오탐). 파서 모듈 부재로 정규식 축소 모드.
Overlay: login 1, lobby 10, room 11, records 7, shop 28, friends 9. 실제 문제: 공지 태그 대비 2.42~2.62, 상점 가격 3.3, 기본 버튼 #fff5e4/#6c7b61 4.19 (전역), 10~11px 글자 (records year-month 등), room h1→h3 건너뜀, room 안내 줄 224자. dark-glow는 inset 패널 음영으로 오탐.
측정: .app min-width 980px로 390 가로 넘침 (PC 전용 의도). 콘솔 오류 0, 이름 없는 컨트롤 0, focus-visible 정상. 로비 이미지 PNG 6.9MB (study-room.png 3.31MB, company-...-display.png 2.14MB, avatar.png 1.44MB).

## Persona Red Flags
Jordan: 시작하기 비활성 이유 없음, 빈 할 일 안내 없음, 사이드바에 로비 항목 없고 로비에서 스터디룸이 활성, 학교 테마 막다른 화면.
Sam: 좌석 이동 클릭 의존, 이모지 버튼 라벨 없음, 1년 달력 칸 12px, 말풍선 X 약 12px, 토스트가 꾸미기 저장 버튼 가림 (styles.css:1128).
Casey: 980px 고정 최소폭, 1024에서 사이드바 하단 문구 줄바꿈.

## Minor
Lv. 12 하드코딩 (LobbyPage.tsx:60), "되거야 !" 띄어쓰기/맞춤법, 스터디룸 목록 입장/나가기 정렬, 내 방에도 나가기, 친구 코드 input 높이 불일치, 입장 직후 이름표와 나가기 표지 겹침, 우편함 미수령 표시 없음, 기록 달력 요일 라벨 어긋남과 10월 중복, 영문 eyebrow 11px 3.75:1, 상점 배경 비정수 배율 의심.

## Questions
회사 방은 대시보드인가 공간인가? 로비의 세계관이 왜 하위 화면에서 끊기는가? 미리볼 수 없는 아이템이 보상 루프를 만드는가?
