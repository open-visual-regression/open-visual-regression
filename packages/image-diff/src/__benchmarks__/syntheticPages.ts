import type { Image } from "../types";

// Deterministic fake screenshots for benchmarking: a dark header, a grey
// sidebar, and a main column of text lines, coloured boxes and gaps.

type Rgb = [number, number, number];

export type Block =
  | { kind: "text"; seed: number }
  | { kind: "box"; height: number; color: Rgb }
  | { kind: "gap"; height: number };

const TEXT_HEIGHT = 18;
const BLOCK_SPACING = 8;
const HEADER_HEIGHT = 56;

/** A small seeded random number generator (mulberry32), so pages are reproducible. */
export const seededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** A random mix of text lines, boxes and gaps. */
export const randomBlocks = (count: number, seed: number): Block[] => {
  const random = seededRandom(seed);
  return Array.from({ length: count }, (_, index): Block => {
    const roll = random();
    if (roll < 0.6) {
      return { kind: "text", seed: seed * 1000 + index };
    }
    if (roll < 0.8) {
      return {
        kind: "box",
        height: 40 + Math.floor(random() * 120),
        color: [Math.floor(random() * 200), Math.floor(random() * 200), 200],
      };
    }
    return { kind: "gap", height: 8 + Math.floor(random() * 24) };
  });
};

const blockHeight = (block: Block) => (block.kind === "text" ? TEXT_HEIGHT : block.height);

const createCanvas = (width: number, height: number): Image => {
  const data = new Uint8Array(width * height * 4);
  new Uint32Array(data.buffer).fill(0xffffffff);
  return { width, height, data };
};

const fillRect = (
  image: Image,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Rgb,
) => {
  const pixel = (color[0] | (color[1] << 8) | (color[2] << 16) | (255 << 24)) >>> 0;
  const words = new Uint32Array(image.data.buffer);
  for (let row = Math.max(0, y); row < Math.min(image.height, y + height); row++) {
    words.fill(
      pixel,
      row * image.width + Math.max(0, x),
      row * image.width + Math.min(image.width, x + width),
    );
  }
};

/** Words drawn as runs of small glyph-like bars, different for every seed. */
const drawText = (image: Image, x: number, y: number, width: number, seed: number) => {
  const random = seededRandom(seed);
  for (let cursor = x; cursor < x + width - 40; ) {
    const wordLength = 10 + Math.floor(random() * 50);
    for (let glyph = 0; glyph < wordLength; glyph += 7) {
      const glyphHeight = 6 + Math.floor(random() * 6);
      fillRect(image, cursor + glyph, y + 12 - glyphHeight, 5, glyphHeight, [30, 30, 30]);
    }
    cursor += wordLength + 8;
  }
};

export type PageOptions = {
  sidebarWidth?: number;
  /** A fixed height, as for a viewport-sized screenshot. Defaults to fitting the content. */
  height?: number;
};

/** Renders a page of blocks. The main column starts 20px after the sidebar. */
export const renderPage = (width: number, blocks: Block[], options: PageOptions = {}): Image => {
  const sidebarWidth = options.sidebarWidth ?? 200;
  const left = sidebarWidth + 20;
  const contentHeight = blocks.reduce((sum, block) => sum + blockHeight(block) + BLOCK_SPACING, 80);
  const image = createCanvas(width, options.height ?? contentHeight);

  fillRect(image, 0, 0, width, HEADER_HEIGHT, [17, 24, 39]);
  drawText(image, 24, 22, 200, 1);
  fillRect(image, 0, HEADER_HEIGHT, sidebarWidth, image.height - HEADER_HEIGHT, [243, 244, 246]);
  for (let item = 0; item < 8; item++) {
    drawText(image, 16, 80 + item * 28, 150, 100 + item);
  }

  blocks.reduce((y, block) => {
    if (block.kind === "text") {
      drawText(image, left, y, width - left - 40, block.seed);
    } else if (block.kind === "box") {
      fillRect(image, left, y, width - left - 40, block.height, block.color);
    }
    return y + blockHeight(block) + BLOCK_SPACING;
  }, 72);

  return image;
};

/** Random RGB noise: every row and column unique, so nothing lines up. */
export const noise = (width: number, height: number, seed: number): Image => {
  const random = seededRandom(seed);
  const data = new Uint8Array(width * height * 4);
  for (let index = 0; index < data.length; index++) {
    data[index] = index % 4 === 3 ? 255 : Math.floor(random() * 256);
  }
  return { width, height, data };
};

export const BANNER: Block = { kind: "box", height: 48, color: [250, 200, 60] };
