// Node 22: node tools/art/maple-front-touch.mjs
// Clone A's decoded pixels. Only the explicit, zero-based edits below are painted.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkImage, decodePng, encodePng } from './pixelArt.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const sourcePath = resolve(root, 'art-src/characters/draft-front-a.png');
const sourceBytes = readFileSync(sourcePath);
const a = decodePng(sourceBytes);
assert.deepEqual(checkImage(a, { size: { width: 48, height: 64 } }), []);
const reference = decodePng(readFileSync(resolve(root, 'public/assets/characters/idle-down.png.png')));
const rgba = hex => [...hex.match(/../g).map(n => parseInt(n, 16)), 255];
const hexAt = (im, x, y) => Buffer.from(im.pixels.subarray((y * im.width + x) * 4, (y * im.width + x) * 4 + 3)).toString('hex');
const inside = (x, y, [left, top, right, bottom]) => x >= left && x <= right && y >= top && y <= bottom;

// Independent region bounds: cheeks below the eye glyphs (including their
// bottom skin-shadow row), mouth above the chin, and interior crown/bow only.
const regions = {
  leftCheek: [13, 44, 15, 45],
  rightCheek: [32, 44, 34, 45],
  mouth: [23, 46, 25, 47],
  crown: [18, 24, 22, 27],
  leftBow: [13, 16, 15, 18],
  rightBow: [32, 16, 34, 18],
};
// x, y, expected original RGB, replacement RGB, allowed region.
// Keep the pale outer cheek pixels from A; two warmer rows form each 3x2 core.
const a4Edits = [
  [13, 44, 'fac9cd', 'f9bdc9', 'leftCheek'],
  [14, 44, 'fac9cd', 'f9bdc9', 'leftCheek'],
  [15, 44, 'fac9cd', 'f9bdc9', 'leftCheek'],
  [13, 45, 'f5afbd', 'f2a4b7', 'leftCheek'],
  [14, 45, 'f5afbd', 'f2a4b7', 'leftCheek'],
  [15, 45, 'f5afbd', 'f2a4b7', 'leftCheek'],
  [32, 44, 'fac9cd', 'f9bdc9', 'rightCheek'],
  [33, 44, 'fac9cd', 'f9bdc9', 'rightCheek'],
  [34, 44, 'fac9cd', 'f9bdc9', 'rightCheek'],
  [32, 45, 'f5afbd', 'f2a4b7', 'rightCheek'],
  [33, 45, 'f5afbd', 'f2a4b7', 'rightCheek'],
  [34, 45, 'f5afbd', 'f2a4b7', 'rightCheek'],
  // Retain (23,46); lift the right corner for a three-pixel shallow smile.
  [24, 46, 'cf788c', 'fff0e9', 'mouth'],
  [25, 46, 'fff0e9', 'cf788c', 'mouth'],
  [24, 47, 'fac9cd', 'cf788c', 'mouth'],
];
const a5Edits = [
  ...a4Edits,
  [19, 25, 'cf8ac8', 'f6c5e5', 'crown'],
  [20, 25, 'cf8ac8', 'f6c5e5', 'crown'],
  [19, 26, 'efb2da', 'f6c5e5', 'crown'],
  [13, 16, 'cc57b5', 'f2a5df', 'leftBow'],
  [14, 16, 'cc57b5', 'f2a5df', 'leftBow'],
  [33, 16, 'cc57b5', 'f2a5df', 'rightBow'],
  [34, 16, 'cc57b5', 'f2a5df', 'rightBow'],
];

function touch(edits) {
  const im = { width: a.width, height: a.height, pixels: new Uint8Array(a.pixels) };
  const seen = new Set();
  for (const [x, y, from, to, region] of edits) {
    const key = y * a.width + x;
    assert(!seen.has(key), `Duplicate edit: ${x},${y}`);
    seen.add(key);
    assert(inside(x, y, regions[region]), `Edit outside ${region}: ${x},${y}`);
    assert.equal(hexAt(a, x, y), from, `Unexpected A pixel: ${x},${y}`);
    assert.notEqual(from, to);
    assert.equal(a.pixels[key * 4 + 3], 255);
    im.pixels.set(rgba(to), key * 4);
  }
  return im;
}

function verify(im, expectedCount) {
  const changed = [];
  let outsideAllowed = 0, silhouetteDifferences = 0, protectedDifferences = 0;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 48; x++) {
    const i = (y * 48 + x) * 4;
    const before = a.pixels.subarray(i, i + 4), after = im.pixels.subarray(i, i + 4);
    if ((before[3] > 0) !== (after[3] > 0)) silhouetteDifferences++;
    if (before.every((v, c) => v === after[c])) continue;
    changed.push([x, y]);
    if (!Object.values(regions).some(bounds => inside(x, y, bounds))) outsideAllowed++;
    // Full eye glyph rectangles include lashes, highlights and the shadow row.
    // Protect all pixels at/below the chin and all original outline colours.
    if (y >= 48 || inside(x, y, [13, 37, 19, 43]) || inside(x, y, [27, 37, 33, 43]) ||
        ['352536', '73516e', '79488c', '7f2d84'].includes(hexAt(a, x, y))) protectedDifferences++;
    assert.equal(after[3], before[3], 'Alpha must be unchanged');
  }
  const problems = checkImage(im, { size: { width: 48, height: 64 } });
  assert.equal(changed.length, expectedCount);
  assert(changed.length <= 30);
  assert.equal(outsideAllowed, 0);
  assert.equal(silhouetteDifferences, 0);
  assert.equal(protectedDifferences, 0);
  assert.deepEqual(problems, []);
  return { changed, report: {
    changedPixels: changed.length, outsideAllowedRegions: outsideAllowed,
    allChangesAllowed: outsideAllowed === 0, silhouetteDifferences,
    silhouetteIdentical: silhouetteDifferences === 0, protectedDifferences,
    checkImage: problems,
  } };
}

function canvas(width, height) {
  const im = { width, height, pixels: new Uint8Array(width * height * 4) };
  for (let i = 0; i < im.pixels.length; i += 4) im.pixels.set(rgba('f4e8d5'), i);
  return im;
}
// Nearest neighbour, with source-over compositing onto an opaque background.
function blit(out, im, left, top, scale) {
  const width = Math.round(im.width * scale), height = Math.round(im.height * scale);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sx = Math.min(im.width - 1, Math.floor(x / scale));
    const sy = Math.min(im.height - 1, Math.floor(y / scale));
    const i = (sy * im.width + sx) * 4, j = ((top + y) * out.width + left + x) * 4;
    const alpha = im.pixels[i + 3] / 255;
    for (let c = 0; c < 3; c++) out.pixels[j + c] = Math.round(im.pixels[i + c] * alpha + out.pixels[j + c] * (1 - alpha));
  }
}

function compare(a4, a5) {
  const scale = 256 / reference.height, referenceWidth = Math.round(reference.width * scale);
  const out = canvas(referenceWidth + 3 * 192 + 3 * 96 + 6 * 16, 256);
  blit(out, reference, 0, 0, scale);
  let x = referenceWidth + 16;
  for (const im of [a, a4, a5]) { blit(out, im, x, 0, 4); x += 192 + 16; }
  for (const im of [a, a4, a5]) { blit(out, im, x, 128, 2); x += 96 + 16; }
  return out;
}

function diff(a4, a5) {
  const scale = 8, panelWidth = 48 * scale;
  const out = canvas(panelWidth * 2 + 16, 64 * scale);
  for (const [index, im] of [a4, a5].entries()) {
    const left = index * (panelWidth + 16);
    blit(out, im, left, 0, scale);
    for (const [x, y] of verify(im, index === 0 ? a4Edits.length : a5Edits.length).changed) {
      // One screen-pixel cyan perimeter inside each changed 8x8 source cell.
      // Adjacent edits retain separate boxes and their original colour centres.
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        if (dx === 0 || dx === scale - 1 || dy === 0 || dy === scale - 1)
          out.pixels.set(rgba('00ffff'), ((y * scale + dy) * out.width + left + x * scale + dx) * 4);
      }
    }
  }
  return out;
}

function write(path, im) {
  const destination = resolve(root, path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, encodePng(im));
  console.log(`Written: ${path} (${im.width}x${im.height})`);
  return decodePng(readFileSync(destination));
}

const a4 = touch(a4Edits), a5 = touch(a5Edits);
verify(a4, 15);
verify(a5, 22);
for (const [name, im, count] of [['a4', a4, 15], ['a5', a5, 22]]) {
  const saved = write(`art-src/characters/draft-front-${name}.png`, im);
  console.log(`${name.toUpperCase()}: ${JSON.stringify(verify(saved, count).report)}`);
}
write('art-src/drafts/front-touch-diff.png', diff(a4, a5));
write('art-src/drafts/front-touch-compare.png', compare(a4, a5));
assert.deepEqual(readFileSync(sourcePath), sourceBytes, 'Original A bytes must stay unchanged');
