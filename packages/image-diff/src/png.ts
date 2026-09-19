import { PNG } from "pngjs";

import type { RgbaImage } from "./diffImages";

export const decodePng = (buffer: Buffer): RgbaImage => PNG.sync.read(buffer);

export const encodePng = (pixels: Uint8Array, width: number, height: number): Buffer => {
  const png = new PNG({ width, height });
  png.data = Buffer.from(pixels);
  return PNG.sync.write(png);
};
