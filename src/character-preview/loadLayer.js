import { CANVAS } from "./model.js";

// 파일은 메모리에서만 읽습니다. 서버 전송·원본 수정·색상 변경은 하지 않습니다.
export async function loadLayer(file) {
  const bytes = new Uint8Array(await file.slice(0, 24).arrayBuffer());
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (
    bytes.length < 24 ||
    signature.some((v, i) => bytes[i] !== v) ||
    String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR"
  )
    throw new Error("PNG 이미지 파일을 선택해 주세요.");
  const view = new DataView(bytes.buffer);
  if (
    view.getUint32(16) !== CANVAS.width ||
    view.getUint32(20) !== CANVAS.height
  )
    throw new Error(
      "이미지 크기는 가로 87 × 세로 110px이어야 해요. 파일을 자동으로 자르거나 늘리지 않습니다.",
    );
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS.width;
    canvas.height = CANVAS.height;
    const context = canvas.getContext("2d");
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = false;
    for (let i = 3; i < pixels.length; i += 4)
      if (pixels[i] === 0) {
        transparent = true;
        break;
      }
    if (!transparent)
      throw new Error(
        "배경이 투명한 PNG가 필요해요. 완전히 투명한 픽셀이 있는 파일을 선택해 주세요.",
      );
    return {
      src: URL.createObjectURL(file),
      name: file.name,
      width: CANVAS.width,
      height: CANVAS.height,
    };
  } finally {
    bitmap?.close();
  }
}
