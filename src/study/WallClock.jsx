import { useEffect, useRef, useState } from "react";
import { artBox, companyLayout } from "./companyLayout";

const INK = "#2e2a30";
const MINUTE_INK = "#3a3540";

/** 바늘 한 개를 1배 도트로 긋는다 (각도는 12시에서 시계 방향, 도). */
function drawHand(ctx, cx, cy, degrees, length, color) {
  const a = (degrees * Math.PI) / 180;
  ctx.fillStyle = color;
  for (let t = 0; t <= length; t += 0.25)
    ctx.fillRect(Math.round(cx + Math.sin(a) * t), Math.round(cy - Math.cos(a) * t), 1, 1);
}

/**
 * 회사 방 오른쪽 위 벽시계의 바늘 (2026-11-02 사용자 결정: 실제 시각). 시계판은 방 그림에 있고, 여기서는 시침, 분침, 빨간 가운데 점만
 * 그림과 같은 1배 칸으로 캔버스에 그려 방 배율대로 키운다. 30초마다 다시 그린다.
 * @example <WallClock />
 */
export default function WallClock() {
  const { center, radius, hourHand, minuteHand } = companyLayout.wallClock;
  const size = radius * 2 + 1;
  const canvas = useRef(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    const minutes = now.getMinutes(), hours = (now.getHours() % 12) + minutes / 60;
    drawHand(ctx, radius, radius, hours * 30, hourHand, INK);
    drawHand(ctx, radius, radius, minutes * 6, minuteHand, MINUTE_INK);
    ctx.fillStyle = "#c8483e";
    ctx.fillRect(radius, radius, 2, 1);
    ctx.fillStyle = "#8e2f2a";
    ctx.fillRect(radius, radius + 1, 2, 1);
  }, [now, size, radius, hourHand, minuteHand]);
  const label = `${now.getHours()}시 ${now.getMinutes()}분`;
  return (
    <canvas
      ref={canvas}
      className="wall-clock-hands"
      width={size}
      height={size}
      role="img"
      aria-label={`벽시계 ${label}`}
      data-time={`${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`}
      style={artBox({ x: center.x - radius, y: center.y - radius, width: size, height: size }, companyLayout)}
    />
  );
}
