# Epic: moyeogongbu

> **Status**: In Progress
> **Brief**: `design/game-brief.md`

## Goal

친구들과 진짜 픽셀아트 회사 사무실에 출근해 각자 자리에 앉아 공부하고, 공부한 시간만큼 시급처럼 받은 코인으로 캐릭터와 책상을 꾸미는 PC 웹 앱.

## Scope

브리프 MVP 7개 전부. 빌드 순서대로 진행한다. 구조 정리와 Supabase 기반(빌드 순서 1~2단계)은 Story 001에서 나눠 Story 008로 두었고, 001보다 먼저 끝낸다.

진행 순서: 008, 001, 002, 003, 004, 005, 006, 007.

범위 밖: 새 픽셀아트 방과 방 꾸미기 슬롯(빌드 순서 7단계)은 MVP 목록에 없어 스토리로 만들지 않는다. 아트 제작은 별도로 진행한다.

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 008 | 기반 구조 (001보다 먼저) | Integration | Complete | N/A |
| 001 | 계정 | Integration | Complete | N/A |
| 002 | 공부 세션 | Logic | Complete | N/A |
| 003 | 시급 코인과 퇴근 정산 | Logic | Complete | N/A |
| 004 | 실시간 6석 회사 방 | Integration | Complete | N/A |
| 005 | 공부 기록과 날짜별 할 일 | UI | Complete | N/A |
| 006 | 친구, 우편함, 알림 | Integration | Ready | N/A |
| 007 | 상점과 캐릭터 꾸미기 | UI | Ready | N/A |
