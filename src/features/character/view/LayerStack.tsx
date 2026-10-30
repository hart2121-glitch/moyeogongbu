import { frameIndex } from "../../../study/characterSprites";
import { CANVAS, composeLayers, type Look } from "../model/layers";
import SheetFrame from "./SheetFrame";

interface Props {
  look: Look;
  /** 하위 호환으로 받기만 한다. 그림은 꾸밈의 레이어 시트에서 고른다. */
  baseSrc?: string;
  action?: "idle" | "walk" | "sit" | "rest";
  direction?: "down" | "up" | "left" | "right";
  frame?: number;
  label: string;
  className?: string;
}

/**
 * 꾸밈을 레이어로 겹쳐 그린다 (뒷머리, 몸, 의상, 얼굴, 앞머리, 액세서리). 위치와 확대는 부모가 한 번 정한다.
 * data-layer-* 속성에 레이어마다 고른 아이템 id가, data-direction과 data-frame에 지금 방향과 시트 칸이 남는다.
 */
export default function LayerStack({ look, action = "idle", direction = "down", frame = 0, label, className = "" }: Props) {
  const index = frameIndex(action, direction, frame);
  const layers = composeLayers(look);
  const data = Object.fromEntries(layers.map((l) => [`data-layer-${l.id.replace("_", "-")}`, l.itemId ?? ""]));
  return (
    <div className={`layer-stack ${className}`} role="img" aria-label={label} data-testid="character-layers"
      data-direction={direction} data-pose={`${action}.${direction}`} data-frame={index}
      style={{ aspectRatio: `${CANVAS.width} / ${CANVAS.height}` }} {...data}>
      {layers.map((l) =>
        l.sheet ? <SheetFrame key={l.id} sheet={l.sheet} index={index} layer={l.id} order={l.order} className={l.className} active={l.id === "body"} /> : null,
      )}
    </div>
  );
}
