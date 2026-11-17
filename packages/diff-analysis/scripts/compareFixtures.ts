// Prints naive vs aligned diff stats for every fixture scenario and, with an
// output directory argument, writes baseline | current | naive | aligned PNGs.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

import { alignedDiff, renderAlignedDiff } from "../src/alignedDiff";
import { decodePng, type DiffImage } from "../src/analyzeDiff";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "../src/__tests__/fixtures/aligned");
const outDir = process.argv[2];

const load = (name: string) => decodePng(readFileSync(join(FIXTURES, name)));

const naiveImage = (baseline: DiffImage, current: DiffImage): DiffImage => {
  const width = Math.max(baseline.width, current.width);
  const height = Math.max(baseline.height, current.height);
  const pad = (image: DiffImage) => {
    const data = new Uint8Array(width * height * 4);
    for (let row = 0; row < image.height; row++) {
      data.set(
        image.data.subarray(row * image.width * 4, (row + 1) * image.width * 4),
        row * width * 4,
      );
    }
    return data;
  };
  const output = new Uint8Array(width * height * 4);
  pixelmatch(pad(baseline), pad(current), output, width, height, { threshold: 0.1 });
  return { width, height, data: output };
};

const sideBySide = (images: DiffImage[]): PNG => {
  const gap = 16;
  const width = images.reduce((sum, image) => sum + image.width, 0) + gap * (images.length - 1);
  const height = Math.max(...images.map((image) => image.height));
  const png = new PNG({ width, height });
  png.data.fill(255);
  let offsetX = 0;
  for (const image of images) {
    for (let row = 0; row < image.height; row++) {
      png.data.set(
        image.data.subarray(row * image.width * 4, (row + 1) * image.width * 4),
        (row * width + offsetX) * 4,
      );
    }
    offsetX += image.width + gap;
  }
  return png;
};

const baseline = load("baseline.png");
const rows: string[] = [];
for (const file of readdirSync(FIXTURES)
  .filter((name) => name !== "baseline.png")
  .sort()) {
  const current = load(file);
  const started = performance.now();
  const diff = alignedDiff(baseline, current);
  const ms = performance.now() - started;
  const kinds = diff.regions.map(
    (region) =>
      `${region.kind}@${region.current.x},${region.current.y} ${region.current.width}x${region.current.height}`,
  );
  rows.push(
    `${file.replace(".png", "").padEnd(30)} naive=${String(diff.naivePixelCount).padStart(7)} aligned=${String(diff.changedPixelCount).padStart(7)} ${ms.toFixed(0).padStart(4)}ms  ${kinds.join(" | ")}`,
  );
  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    const png = sideBySide([
      baseline,
      current,
      naiveImage(baseline, current),
      renderAlignedDiff(current, diff),
    ]);
    writeFileSync(join(outDir, file), PNG.sync.write(png));
  }
}
console.log(rows.join("\n"));
