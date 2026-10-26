export type OvrStoryParameterViewport =
  | string
  | { browser?: string; width: number; height?: number };

/** `true` blocks every external host, `{ allow }` every one but these, `false` none. */
export type BlockExternalRequests = boolean | { allow: string[] };

export type OvrStoryParameters = {
  viewports?: OvrStoryParameterViewport[];
  diffThreshold?: number;
  waitForTimeout?: number;
  blockExternalRequests?: BlockExternalRequests;
  skip?: boolean;
};

/** Upper bound on `waitForTimeout`, so one story can't eat its whole capture job budget. */
export const MAX_WAIT_FOR_TIMEOUT_MS = 30_000;
