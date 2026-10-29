import { CANVAS, composeLayers, poseKey, type Look } from "../model/layers";

interface Props {
  look: Look;
  /** "base-sprite" 레이어가 쓸 완성형 그림. */
  baseSrc: string;
  action?: string;
  direction?: string;
  frame?: number;
  label: string;
  className?: string;
}

/**
 * 꾸밈을 레이어로 겹쳐 그린다 (뒷머리, 몸, 의상, 얼굴, 앞머리, 액세서리). 위치와 확대는 부모가 한 번 정한다.
 * data-layer-* 속성에 레이어마다 고른 아이템 id가 남는다.
 */
export default function LayerStack({ look, baseSrc, action = "idle", direction = "down", frame = 0, label, className = "" }: Props) {
  const layers = composeLayers(look, poseKey(action, direction, frame), baseSrc);
  const data = Object.fromEntries(layers.map((l) => [`data-layer-${l.id.replace("_", "-")}`, l.itemId ?? ""]));
  return (
    <div className={`layer-stack ${className}`} role="img" aria-label={label} data-testid="character-layers"
      style={{ aspectRatio: `${CANVAS.width} / ${CANVAS.height}` }} {...data}>
      {layers.map((l) =>
        l.src ? (
          <img key={l.id} data-layer={l.id} className={l.className} src={l.src} alt="" draggable={false} style={{ zIndex: l.order }} />
        ) : null,
      )}
    </div>
  );
}
