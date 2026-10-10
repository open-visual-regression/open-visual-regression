import { formatTable } from "../../table";
import type { CaptureResult } from "./run";

const HEADERS = ["TARGET", "BROWSER", "VIEWPORT", "RUNS", "IMAGES", "RESULT"];

export type CaptureIssue = {
  targetId: string;
  message: string;
};

export type CaptureReport = {
  results: CaptureResult[];
  issues: CaptureIssue[];
};

export const getCaptureResultStatus = (result: CaptureResult): string => {
  if (result.errors.length > 0) {
    return "error";
  }

  return result.images.length > 1 ? "unstable" : "stable";
};

export const isCaptureReportPassing = ({ results, issues }: CaptureReport): boolean =>
  issues.length === 0 && results.every((result) => getCaptureResultStatus(result) === "stable");

const formatSummary = (results: CaptureResult[]): string => {
  const stable = results.filter((result) => getCaptureResultStatus(result) === "stable").length;

  return `${stable} of ${results.length} captures produced the same image on every run.`;
};

export const formatCaptureReport = (report: CaptureReport, json: boolean | undefined): string => {
  if (json) {
    return JSON.stringify(report, null, 2);
  }

  const sections: string[] = [];

  if (report.results.length > 0) {
    sections.push(
      formatTable(
        HEADERS,
        report.results.map((result) => [
          result.targetId,
          result.browser,
          result.viewportName,
          String(result.runs),
          String(result.images.length),
          getCaptureResultStatus(result),
        ]),
      ),
    );
  }

  const details = report.results.flatMap((result) => [
    ...result.errors.map((error) => `${result.targetId} (${result.viewportName}): ${error}`),
    ...(getCaptureResultStatus(result) === "unstable"
      ? result.images
          .filter((image) => image.file)
          .map(
            (image) => `${result.targetId} (${result.viewportName}): ${image.count}x ${image.file}`,
          )
      : []),
  ]);

  if (details.length > 0) {
    sections.push(details.join("\n"));
  }

  if (report.issues.length > 0) {
    sections.push(report.issues.map((issue) => `${issue.targetId}: ${issue.message}`).join("\n"));
  }

  sections.push(formatSummary(report.results));

  return sections.join("\n\n");
};
