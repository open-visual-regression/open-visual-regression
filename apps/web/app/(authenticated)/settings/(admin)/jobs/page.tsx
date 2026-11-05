import { notFound } from "next/navigation";

import { Typography } from "@ovr/ui/components/typography";

import { serverClient } from "@/lib/router";
import { verifyRole } from "@/lib/utils/authorization";
import { serverError } from "@/lib/utils/errors";

import { CaptureQueueSection } from "./_components/capture-queue-section/CaptureQueueSection";
import { FlakyDetectionSection } from "./_components/flaky-detection-section/FlakyDetectionSection";

export default async function SettingsJobsPage() {
  const verifyRoleResult = await verifyRole("admin");

  if (verifyRoleResult.status === "error") {
    serverError(verifyRoleResult.error);
  }

  if (!verifyRoleResult.data) {
    notFound();
  }

  const [[flakyDetectionError, flakyDetectionResult], [captureQueueError, captureQueueResult]] =
    await Promise.all([serverClient.jobs.getFlakyDetection(), serverClient.jobs.getCaptureQueue()]);

  if (flakyDetectionError) {
    serverError(flakyDetectionError);
  }

  if (captureQueueError) {
    serverError(captureQueueError);
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h1" as="h1">
        jobs
      </Typography>
      <FlakyDetectionSection {...flakyDetectionResult} />
      <CaptureQueueSection {...captureQueueResult} />
    </div>
  );
}
