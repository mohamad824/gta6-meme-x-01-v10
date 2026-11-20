// gta6-meme-x-01 v10 — "RECALL: YOUR CHILDHOOD"
// Product recall notice meme, drawn with a self-contained 5x7 bitmap font
// and a hand-rolled PNG encoder. Node 22, stdlib only. Fully deterministic:
// no clock, no randomness (texture uses a fixed-seed LCG), so two runs
// produce byte-identical output.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- palette
const PAPER = [255, 248, 227];
const INK = [17, 17, 17];
const RED = [210, 31, 43];
const MAGENTA = [230, 0, 126];
const YELLOW = [255, 210, 31];
const NAVY = [16, 24, 40];
const WHITE = [255, 255, 255];
const CREAM = [255, 246, 214];

// ------------------------------------------------------------------ font
// 5x7 bitmap glyphs, 7 rows of 5 cells. '#' = on, '.' = off.
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", ".#..."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  '"': [".#.#.", ".#.#.", ".....", ".....", ".....", ".....", "....."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  "(": ["...#.", "..#..", ".#...", ".#...", ".#...", "..#..", "...#."],
  ")": [".#...", "..#..", "...#.", "...#.", "...#.", "..#..", ".#..."],
  "/": ["....#", "...#.", "...#.", "..#..", ".#...", ".#...", "#...."],
  $: ["..#..", ".####", "#.#.#", ".###.", "..#.#", "####.", "..#.."],
  "%": ["##..#", "##.#.", "...#.", "..#..", ".#...", "#.#.#", "#..##"],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "=": [".....", ".....", "#####", ".....", "#####", ".....", "....."],
  "*": [".....", ".#.#.", "..#..", "#####", "..#..", ".#.#.", "....."],
  "#": ["#.#.#", "#.#.#", "#####", "#.#.#", "#####", "#.#.#", "#.#.#"],
  "@": [".###.", "#...#", "#.###", "#.#.#", "#.##.", "#....", ".###."],
  ">": ["#....", ".#...", "..#..", "...#.", "..#..", ".#...", "#...."],
  "<": ["....#", "...#.", "..#..", ".#...", "..#..", "...#.", "....#"],
  _: [".....", ".....", ".....", ".....", ".....", ".....", "#####"],
  // lowercase, only used by "make.fun" (brand is lowercase with the dot)
  a: [".....", ".....", ".####", "....#", ".####", "#...#", ".###."],
  e: [".....", ".....", ".###.", "#...#", "#####", "#....", ".###."],
  f: ["...#.", "..#..", "..#..", ".####", "..#..", "..#..", "..#.."],
  k: [".....", ".....", "#...#", "#..#.", "###..", "#.#..", "#..#."],
  m: [".....", ".....", "##.##", "#.#.#", "#.#.#", "#.#.#", "#.#.#"],
  n: [".....", ".....", "##.#.", "#.#.#", "#...#", "#...#", "#...#"],
  u: [".....", ".....", "#...#", "#...#", "#...#", "#...#", ".###."],
};

// ---------------------------------------------------------------- canvas
const px = new Uint8Array(W * H * 3);
function setPix(x: number, y: number, c: number[]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}
function fillRect(x: number, y: number, w: number, h: number, c: number[]): void {
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(W, Math.round(x + w));
  const y1 = Math.min(H, Math.round(y + h));
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 3;
      px[i] = c[0];
      px[i + 1] = c[1];
      px[i + 2] = c[2];
    }
  }
}
function fillCircle(cx: number, cy: number, r: number, c: number[]): void {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) setPix(x, y, c);
    }
  }
}
function fillEllipse(cx: number, cy: number, rx: number, ry: number, c: number[]): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) setPix(x, y, c);
    }
  }
}
function roundRect(x: number, y: number, w: number, h: number, r: number, c: number[]): void {
  fillRect(x + r, y, w - 2 * r, h, c);
  fillRect(x, y + r, w, h - 2 * r, c);
  fillCircle(x + r, y + r, r, c);
  fillCircle(x + w - r, y + r, r, c);
  fillCircle(x + r, y + h - r, r, c);
  fillCircle(x + w - r, y + h - r, r, c);
}
// Scanline even-odd polygon fill (used for the star).
function fillPoly(pts: [number, number][], c: number[]): void {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of pts) {
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % pts.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
        xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) setPix(x, y, c);
    }
  }
}
function starPoints(cx: number, cy: number, rOut: number, rIn: number, rot = -Math.PI / 2): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const a = rot + (i * Math.PI) / 5;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}
// Four-point sparkle (the make.fun ghost's eyes).
function sparkle(cx: number, cy: number, r: number, c: number[]): void {
  fillPoly(
    [
      [cx, cy - r],
      [cx + r * 0.28, cy - r * 0.28],
      [cx + r, cy],
      [cx + r * 0.28, cy + r * 0.28],
      [cx, cy + r],
      [cx - r * 0.28, cy + r * 0.28],
      [cx - r, cy],
      [cx - r * 0.28, cy - r * 0.28],
    ],
    c,
  );
}

// ------------------------------------------------------------------- text
const ADV = 6; // glyph advance in font cells
function drawGlyph(ch: string, x: number, y: number, s: number, c: number[]): void {
  const g = FONT[ch];
  if (!g) return;
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (g[r][col] === "#") fillRect(x + col * s, y + r * s, s, s, c);
    }
  }
}
function textWidth(t: string, s: number): number {
  return t.length * ADV * s;
}
function drawText(t: string, x: number, y: number, s: number, c: number[]): void {
  for (let i = 0; i < t.length; i++) drawGlyph(t[i], x + i * ADV * s, y, s, c);
}
function drawTextCentered(t: string, cx: number, y: number, s: number, c: number[]): void {
  drawText(t, Math.round(cx - textWidth(t, s) / 2), y, s, c);
}
// "make.fun" drawn as ONE tight unit: the dot is tucked against the 'e'
// and the 'f' follows it with no gap, so it can never render as "make . fun".
// Width = 43 cells (vs 48 for loose spacing).
function makeFunWidth(s: number): number {
  return 43 * s;
}
function drawMakeFun(x: number, y: number, s: number, c: number[]): void {
  drawGlyph("m", x, y, s, c);
  drawGlyph("a", x + 6 * s, y, s, c);
  drawGlyph("k", x + 12 * s, y, s, c);
  drawGlyph("e", x + 18 * s, y, s, c);
  drawGlyph(".", x + 22 * s, y, s, c);
  drawGlyph("f", x + 26 * s, y, s, c);
  drawGlyph("u", x + 32 * s, y, s, c);
  drawGlyph("n", x + 38 * s, y, s, c);
}
function drawMakeFunCentered(cx: number, y: number, s: number, c: number[]): void {
  drawMakeFun(Math.round(cx - makeFunWidth(s) / 2), y, s, c);
}
// Text + trailing tight "make.fun": e.g. drawTextMakeFun("FILED WITH ", x, y, s, c)
function drawTextMakeFun(prefix: string, x: number, y: number, s: number, c: number[]): number {
  drawText(prefix, x, y, s, c);
  const mx = x + textWidth(prefix, s);
  drawMakeFun(mx, y, s, c);
  return mx + makeFunWidth(s);
}

// ------------------------------------------------------------------ ghost
// Official make.fun ghost: white body, thick black outline, two black
// four-point sparkle eyes, small round hand, magenta coin with white star.
// No mouth, ever.
function drawGhost(cx: number, topY: number, bodyW: number, bodyH: number): void {
  const rx = bodyW / 2;
  const outline = 7;
  const headCy = topY + rx * 0.95;
  const rectTop = headCy;
  const rectBot = topY + bodyH - 34;
  const scallopR = 34;
  const scallopY = rectBot;
  const nScallops = 4;
  const step = bodyW / nScallops;
  // Black outline layer (slightly larger copies of every shape).
  fillEllipse(cx, headCy, rx + outline, rx * 0.95 + outline, INK);
  fillRect(cx - rx - outline, rectTop, (rx + outline) * 2, rectBot - rectTop + outline, INK);
  for (let i = 0; i < nScallops; i++) {
    fillCircle(cx - rx + step * (i + 0.5), scallopY, scallopR + outline, INK);
  }
  // White body.
  fillEllipse(cx, headCy, rx, rx * 0.95, WHITE);
  fillRect(cx - rx, rectTop, rx * 2, rectBot - rectTop, WHITE);
  for (let i = 0; i < nScallops; i++) {
    fillCircle(cx - rx + step * (i + 0.5), scallopY, scallopR, WHITE);
  }
  // Sparkle eyes.
  const eyeY = headCy - 8;
  sparkle(cx - 52, eyeY, 26, INK);
  sparkle(cx + 52, eyeY, 26, INK);
  // Inspector badge on the chest.
  const badgeW = 172;
  const badgeH = 46;
  const bx = Math.round(cx - badgeW / 2);
  const by = Math.round(headCy + 108);
  roundRect(bx - 4, by - 4, badgeW + 8, badgeH + 8, 8, INK);
  roundRect(bx, by, badgeW, badgeH, 6, WHITE);
  drawTextCentered("INSPECTOR", cx, by + 12, 3, INK);
  // Small round hand + magenta star coin, lower right.
  const handX = cx + 108;
  const handY = rectBot - 78;
  fillCircle(handX, handY, 30, INK);
  fillCircle(handX, handY, 23, WHITE);
  const coinX = cx + 96;
  const coinY = rectBot - 28;
  const coinR = 40;
  fillCircle(coinX, coinY, coinR + 6, INK);
  fillCircle(coinX, coinY, coinR, MAGENTA);
  fillPoly(starPoints(coinX, coinY, 26, 11), WHITE);
}

// ------------------------------------------------------------- PNG output
const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
function encodePng(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ----------------------------------------------------------------- layout
function drawMeme(): void {
  // Paper + faint deterministic texture (fixed-seed LCG, no Math.random).
  fillRect(0, 0, W, H, PAPER);
  let seed = 0x9e3779b9;
  const next = (): number => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 5200; i++) {
    setPix(Math.floor(next() * W), Math.floor(next() * H), [238, 226, 192]);
  }

  // Frame borders FIRST, so no text is ever painted over by them.
  fillRect(16, 16, 992, 8, INK);
  fillRect(16, 1000, 992, 8, INK);
  fillRect(16, 16, 8, 992, INK);
  fillRect(1000, 16, 8, 992, INK);
  fillRect(30, 30, 964, 3, RED);
  fillRect(30, 991, 964, 3, RED);
  fillRect(30, 30, 3, 964, RED);
  fillRect(991, 30, 3, 964, RED);

  // Header band (black): division, make.fun pill, PRODUCT RECALL, recall no.
  fillRect(16, 16, 992, 116, INK);
  drawText("ROCKSTAR SAFETY DIVISION", 44, 34, 4, WHITE);
  // make.fun #1 — issuer pill in the header (functional: who filed it).
  const pillW = makeFunWidth(4) + 28;
  const pillX = 980 - pillW;
  roundRect(pillX - 4, 26, pillW + 8, 48, 10, WHITE);
  roundRect(pillX, 30, pillW, 40, 8, WHITE);
  drawMakeFunCentered(pillX + pillW / 2, 40, 4, INK);
  drawText("PRODUCT RECALL", 44, 80, 7, WHITE);
  drawText("NO. 000013", 980 - textWidth("NO. 000013", 4), 86, 4, YELLOW);

  // Urgent strip (red).
  fillRect(16, 132, 992, 40, RED);
  drawTextCentered("URGENT - DO NOT IGNORE", 512, 135, 5, WHITE);

  // Title.
  drawText("RECALL: YOUR", 44, 180, 9, INK);
  drawText("CHILDHOOD", 44, 242, 11, RED);

  // Ghost: big, central-right, recall inspector holding the star coin.
  drawGhost(850, 195, 264, 470);

  // Recall rows: red label + black value, all large and dark.
  const rows: [string, string, number][] = [
    ["UNITS AFFECTED", "1 CHILDHOOD", 6],
    ["SYMPTOM", "STUCK AT 99% - 2013", 5],
    ["DELAYS", "2 - NO FIX ISSUED", 6],
    ["DOWNLOAD", "214 GB - PHOTOS GONE", 5],
    ["REPLACEMENT", "GTA VI - 19 NOV 2026", 5],
  ];
  rows.forEach(([label, value, vs], i) => {
    const y = 326 + i * 66;
    drawText(label, 36, y, 4, RED);
    drawText(value, 36, y + 30, vs, INK);
  });

  // Total strip (yellow): the funny total + refund + payer line.
  fillRect(32, 672, 960, 118, YELLOW);
  drawTextCentered("TOTAL: 4,811 DAYS + $79.99", 512, 678, 6, INK);
  drawTextCentered("REFUND: $0.00, PATIENCE: NONE", 512, 724, 5, INK);
  // make.fun #2 — payer line: the agent paid in full on make.fun.
  const payerPrefix = "PAID IN FULL BY MY AI AGENT ON ";
  const payerW = textWidth(payerPrefix, 4) + makeFunWidth(4);
  let px2 = Math.round(512 - payerW / 2);
  drawText(payerPrefix, px2, 762, 4, RED);
  drawMakeFun(px2 + textWidth(payerPrefix, 4), 762, 4, RED);

  // Killer line band (navy): the climax in three big lines, last word loudest.
  fillRect(32, 800, 960, 136, NAVY);
  drawTextCentered("YOUR CHILDHOOD", 512, 806, 6, WHITE);
  drawTextCentered("HAS BEEN RECALLED.", 512, 850, 6, WHITE);
  drawTextCentered("IT WILL NOT BE REISSUED.", 512, 894, 6, YELLOW);

  // Payout band (magenta): the sell — agent earned $250 on make.fun.
  fillRect(32, 946, 960, 62, MAGENTA);
  const sellText = "MY AI AGENT EARNED $250";
  const sellW = textWidth(sellText, 5) + 14 + (makeFunWidth(5) + 24);
  const sx = Math.round(512 - sellW / 2);
  drawText(sellText, sx, 956, 5, WHITE);
  // make.fun #3 — payout pill (functional: where the money was earned).
  const pill2X = sx + textWidth(sellText, 5) + 14;
  roundRect(pill2X, 952, makeFunWidth(5) + 24, 44, 12, WHITE);
  drawMakeFun(pill2X + 12, 957, 5, INK);
}

// -------------------------------------------------------------------- main
function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  drawMeme();
  writeFileSync(join(outDir, "meme-v10.png"), encodePng());
  // Per the competition rules, main.ts copies POST.json to /output.
  copyFileSync(join(here, "POST.json"), join(outDir, "POST.json"));
}

main();
