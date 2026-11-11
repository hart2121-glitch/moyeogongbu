import { createContext, useContext } from "react";
import { DESK_MONITOR_ART } from "../config/shop";
import { COMPANY_ROOM_ART, companyLayout } from "./companyLayout";
import { CAFE_LAPTOP_ART, CAFE_ROOM_ART, cafeLayout } from "./cafeLayout";

/**
 * 실시간 공부방 한 곳의 장면: 배치(layout), 방 그림, 탁자 위 화면 그림, 화면 문구.
 * 회사 방과 공용 카페는 같은 이동, 좌석, 책상 세트 코드를 쓰고 장면만 다르다 (Story 011).
 * words: 공부 세션 바와 정산 카드 문구 (today: 오늘 공부 시간 앞 글자, time: 정산의 시간 줄, left: 나간 상태, lounge: 쉬러 가기 단추).
 * @typedef {{ today: string, time: string, left: string, lounge: string }} RoomWords
 * @typedef {{ id: "company" | "cafe", layout: typeof import("./companyLayout").companyLayout, art: string, monitorArt: string, alt: string, title: string, loungeName: string, exitLabel: string, decor: boolean, words: RoomWords }} RoomScene
 */

/** @type {RoomScene} 회사 테마 스터디룸. */
export const COMPANY_SCENE = {
  id: "company",
  layout: companyLayout,
  art: COMPANY_ROOM_ART,
  monitorArt: DESK_MONITOR_ART,
  alt: "회사 스터디룸: 휴게실, 화장실, 책상 여섯 자리가 있는 사무실",
  title: "회사 테마 스터디룸",
  loungeName: "휴게실",
  exitLabel: "퇴근하기",
  decor: true,
  words: { today: "오늘 근무", time: "근무 시간", left: "퇴근", lounge: "휴게실로 가기" },
};

/** @type {RoomScene} 공용 스터디카페. */
export const CAFE_SCENE = {
  id: "cafe",
  layout: cafeLayout,
  art: CAFE_ROOM_ART,
  monitorArt: CAFE_LAPTOP_ART,
  alt: "공용 스터디카페: 카운터, 소파, 화장실, 탁자 여섯 자리가 있는 카페",
  title: "공용 스터디카페",
  loungeName: "카운터",
  exitLabel: "나가기",
  decor: false,
  words: { today: "오늘 공부", time: "공부 시간", left: "나감", lounge: "카운터로 가기" },
};

/** 지금 그리는 방의 장면. CompanyRoom이 정하고, 그 안의 캐릭터, 책상 세트, 벽시계가 읽는다. */
export const RoomSceneContext = createContext(COMPANY_SCENE);

/** @returns {RoomScene} */
export const useRoomScene = () => useContext(RoomSceneContext);
