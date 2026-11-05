import {
  captureQueuePolicySchema,
  storedCaptureQueueSettingsSchema,
  type CaptureQueue,
  type CaptureQueuePolicy,
  type CaptureQueueSettings,
} from "@ovr/api/contracts/jobs";
import { dbClient } from "@ovr/db/client";

// Set by deployments that need one order, such as the Helm chart forcing fifo for KEDA's
// generated trigger, so it wins over what an admin saves. An unknown value is ignored.
export const getEnvCaptureQueuePolicy = (): CaptureQueuePolicy | null => {
  const parsed = captureQueuePolicySchema.safeParse(process.env.OVR_CAPTURE_QUEUE_POLICY);
  return parsed.success ? parsed.data : null;
};

const getCaptureQueueSettings = async (): Promise<CaptureQueueSettings> => {
  const stored = await dbClient.jobSettings.find("capture_queue");
  return storedCaptureQueueSettingsSchema.parse(stored?.settings);
};

export const getCaptureQueuePolicy = async (): Promise<CaptureQueuePolicy> =>
  getEnvCaptureQueuePolicy() ?? (await getCaptureQueueSettings()).policy;

export const getCaptureQueue = async (): Promise<CaptureQueue> => ({
  settings: await getCaptureQueueSettings(),
  envPolicy: getEnvCaptureQueuePolicy(),
});

export const saveCaptureQueueSettings = async (
  settings: CaptureQueueSettings,
  updatedBy: string,
): Promise<void> => {
  await dbClient.jobSettings.upsert({ job: "capture_queue", settings, updatedBy });
};
