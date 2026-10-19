import { CANVAS, LAYERS, poseKey } from "./model.js";

// 공통 프레임 선택과 공통 변환: 미래의 애니메이션 시계/팔레트 처리와 분리합니다.
export default function LayerStack({ model, pose }) {
  const key = poseKey(pose);
  return (
    <div
      className="cp-canvas"
      data-testid="layer-stack"
      style={{ aspectRatio: `${CANVAS.width} / ${CANVAS.height}` }}
      role="img"
      aria-label="캐릭터 레이어 합성 결과"
    >
      {LAYERS.map((layer) => {
        const item = model.layers[layer.id],
          asset = item.frames[key];
        return item.enabled && asset ? (
          <img
            key={layer.id}
            data-layer={layer.id}
            src={asset.src}
            alt=""
            draggable="false"
            style={{ zIndex: layer.order }}
          />
        ) : null;
      })}
    </div>
  );
}
