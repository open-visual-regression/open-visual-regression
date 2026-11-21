/** An RGBA bitmap, four bytes per pixel, rows top to bottom. */
export type RgbaImage = {
  width: number;
  height: number;
  data: Uint8Array;
};

/** The color threshold OVR compares pixels with. */
export const PIXELMATCH_THRESHOLD = 0.1;

/** Places an image at the top left of a transparent canvas of the given size. */
export const padToCanvas = (image: RgbaImage, width: number, height: number): RgbaImage => {
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
