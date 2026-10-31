import { SHEET_FRAME } from "../../../study/characterSprites";

interface Props {
  sheet: string;
  index: number;
  layer: string;
  order: number;
  className?: string;
  active?: boolean;
  alt?: string;
  onError?: () => void;
}

/**
 * 레이어 시트에서 한 칸(56×72)만 보이게 자른다. 시트 이미지를 칸 수만큼 넓히고 칸 번호만큼 옮긴다.
 * 부모 상자 폭에 맞춰 늘어나며, 도트가 흐려지지 않게 pixelated로 그린다.
 */
export default function SheetFrame({ sheet, index, layer, order, className = "", active = false, alt = "", onError }: Props) {
  return (
    <span className="sheet-frame" data-layer={layer} style={{ zIndex: order, aspectRatio: `${SHEET_FRAME.width} / ${SHEET_FRAME.height}` }}>
      <img
        src={sheet}
        className={className}
        alt={alt}
        aria-hidden={alt ? undefined : true}
        draggable={false}
        data-layer={layer}
        data-active={active ? "true" : undefined}
        onError={onError}
        style={{ width: `${SHEET_FRAME.count * 100}%`, transform: `translateX(${(-index * 100) / SHEET_FRAME.count}%)` }}
      />
    </span>
  );
}
