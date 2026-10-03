import { z } from "zod";

export const isFlakyDetectionEnabled = (): boolean =>
  z.stringbool().catch(false).parse(process.env.OVR_FLAKY_DETECTION_ENABLED);
