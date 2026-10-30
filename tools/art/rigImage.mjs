// 리그용 RGBA 이미지 도우미. 이미지는 {width, height, pixels: Uint8Array(RGBA)}.

/** 같은 크기의 투명 이미지. */
export const emptyLike = (im) => ({ width: im.width, height: im.height, pixels: new Uint8Array(im.width * im.height * 4) });

/** (x, y) 픽셀의 시작 인덱스. 그림 밖이면 -1. */
export const pixelIndex = (im, x, y) => (x < 0 || y < 0 || x >= im.width || y >= im.height ? -1 : (y * im.width + x) * 4);

/** RGB를 HSV로 (h: 0-360, s/v: 0-1). 부품을 색으로 가를 때 쓴다. */
export function hsv(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) h = max === r ? 60 * (((g - b) / d) % 6) : max === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
  return { h: (h + 360) % 360, s: max ? d / max : 0, v: max / 255 };
}
