const PLAYWRIGHT_MISSING_MESSAGE =
  "ovr capture needs Playwright. Install it with `npm install --save-dev playwright`, then install a browser with `npx playwright install chromium`.";

const isMissingPlaywright = (error: unknown): boolean =>
  error instanceof Error &&
  "code" in error &&
  error.code === "ERR_MODULE_NOT_FOUND" &&
  error.message.includes("'playwright'");

export const loadWithPlaywright = async <T>(load: () => Promise<T>): Promise<T> => {
  try {
    return await load();
  } catch (error) {
    if (isMissingPlaywright(error)) {
      throw new Error(PLAYWRIGHT_MISSING_MESSAGE);
    }
    throw error;
  }
};
