import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const PIXELMATCH_THRESHOLD = 0.1;
const MAX_SHIFT = 32;
const SHIFT_SAMPLE_SIZE = 2000;
const MIN_EXPLAINED_RATIO = 0.5;
const COLOR_TOLERANCE = 24;

export type DiffImage = {
  width: number;
  height: number;
  data: Uint8Array;
};

export type ImageSize = {
  width: number;
  height: number;
};

export type ChangedRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SizeChange = {
  from: ImageSize;
  to: ImageSize;
};

export type ContentShift = {
  x: number;
  y: number;
  explainedPercent: number;
};

export type DiffAnalysis = {
  changedPixelCount: number;
  changedRegion: ChangedRegion | null;
  shift: ContentShift | null;
  sizeChange: SizeChange | null;
};

type Point = {
  x: number;
  y: number;
};

export const decodePng = (buffer: Uint8Array): DiffImage => {
  const png = PNG.sync.read(Buffer.from(buffer));

  return { width: png.width, height: png.height, data: png.data };
};

const padToCanvas = (image: DiffImage, width: number, height: number): DiffImage => {
  if (image.width === width && image.height === height) {
    return image;
  }

  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < image.height; y++) {
    const rowStart = y * image.width * 4;
    data.set(image.data.subarray(rowStart, rowStart + image.width * 4), y * width * 4);
  }

  return { width, height, data };
};

const findChangedPoints = (baseline: DiffImage, current: DiffImage): Point[] => {
  const { width, height } = baseline;
  const output = new Uint8Array(width * height * 4);

  pixelmatch(baseline.data, current.data, output, width, height, {
    threshold: PIXELMATCH_THRESHOLD,
    diffMask: true,
    diffColor: [255, 0, 0],
  });

  const points: Point[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const isDiffPixel = output[index + 3] !== 0 && output[index + 1] === 0;
      if (isDiffPixel) {
        points.push({ x, y });
      }
    }
  }

  return points;
};

const getBoundingRegion = (points: Point[]): ChangedRegion | null => {
  if (points.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { x, y } of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
};

const matchesShifted = (
  baseline: DiffImage,
  current: DiffImage,
  { x, y }: Point,
  shift: Point,
): boolean => {
  const sourceX = x - shift.x;
  const sourceY = y - shift.y;
  if (sourceX < 0 || sourceY < 0 || sourceX >= baseline.width || sourceY >= baseline.height) {
    return false;
  }

  const currentIndex = (y * current.width + x) * 4;
  const baselineIndex = (sourceY * baseline.width + sourceX) * 4;
  for (let channel = 0; channel < 3; channel++) {
    const difference = Math.abs(
      current.data[currentIndex + channel]! - baseline.data[baselineIndex + channel]!,
    );
    if (difference > COLOR_TOLERANCE) {
      return false;
    }
  }

  return true;
};

const sample = (points: Point[], size: number): Point[] => {
  if (points.length <= size) {
    return points;
  }

  const step = points.length / size;
  return Array.from({ length: size }, (_, index) => points[Math.floor(index * step)]!);
};

const countMatches = (baseline: DiffImage, current: DiffImage, points: Point[], shift: Point) =>
  points.filter((point) => matchesShifted(baseline, current, point, shift)).length;

const findShift = (
  baseline: DiffImage,
  current: DiffImage,
  points: Point[],
): ContentShift | null => {
  const candidates = sample(points, SHIFT_SAMPLE_SIZE);
  let best: Point | null = null;
  let bestMatches = 0;

  for (let y = -MAX_SHIFT; y <= MAX_SHIFT; y++) {
    for (let x = -MAX_SHIFT; x <= MAX_SHIFT; x++) {
      if (x === 0 && y === 0) {
        continue;
      }

      const matches = countMatches(baseline, current, candidates, { x, y });
      if (matches > bestMatches) {
        best = { x, y };
        bestMatches = matches;
      }
    }
  }

  if (!best) {
    return null;
  }

  const explainedRatio = countMatches(baseline, current, points, best) / points.length;
  if (explainedRatio < MIN_EXPLAINED_RATIO) {
    return null;
  }

  return { ...best, explainedPercent: Math.round(explainedRatio * 100) };
};

export const analyzeDiff = (baseline: DiffImage, current: DiffImage): DiffAnalysis => {
  const width = Math.max(baseline.width, current.width);
  const height = Math.max(baseline.height, current.height);
  const paddedBaseline = padToCanvas(baseline, width, height);
  const paddedCurrent = padToCanvas(current, width, height);

  const points = findChangedPoints(paddedBaseline, paddedCurrent);
  const sizeChanged = baseline.width !== current.width || baseline.height !== current.height;

  return {
    changedPixelCount: points.length,
    changedRegion: getBoundingRegion(points),
    shift: points.length > 0 ? findShift(paddedBaseline, paddedCurrent, points) : null,
    sizeChange: sizeChanged
      ? {
          from: { width: baseline.width, height: baseline.height },
          to: { width: current.width, height: current.height },
        }
      : null,
  };
};
