import { HOME_BASE, HOME_SIZE, homeLayers, type HomeLayer, type HomeLook } from "../model/homeDecor";

/**
 * 내 방 그림: 빈 방 바탕 위에 자리별 층을 그리는 순서대로 정수 배율(scale)로 얹는다. 부모가 위치 기준(position)이다.
 * 로비 장면(3배)과 꾸미기 미리보기(1배), 선택지 그림이 같은 층을 쓴다.
 * @example <HomeRoomArt look={home} scale={3} />
 */
export default function HomeRoomArt({ look, scale, layers }: { look?: HomeLook; scale: number; layers?: HomeLayer[] }) {
  return (
    <>
      <img className="home-room-part" src={HOME_BASE} alt="" draggable={false} style={{ left: 0, top: 0, width: HOME_SIZE.width * scale }} />
      {(layers ?? homeLayers(look ?? {})).map((layer) => (
        <img
          key={layer.id}
          className="home-room-part"
          data-slot={layer.id}
          src={layer.src}
          alt=""
          draggable={false}
          style={{ left: layer.x * scale, top: layer.y * scale, width: layer.width * scale }}
        />
      ))}
    </>
  );
}
