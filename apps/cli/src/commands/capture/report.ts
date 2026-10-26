import { formatTable } from "../../table";
import type { CaptureResult } from "./run";

const HEADERS = ["TARGET", "BROWSER", "VIEWPORT", "RUNS", "IMAGES", "MAX DIFF%", "RESULT"];

const DIFF_PERCENT_PRECISION = 2;

const BLOCKED_HOSTS_HINT =
  "With blockExternalRequests set, captures only load the Storybook build and the hosts it allows. Add hosts with { allow: [...] } in ovr.config or the story's parameters.ovr.";

export type CaptureIssue = {
  targetId: string;
  message: string;
};

export type CaptureReport = {
  results: CaptureResult[];
  issues: CaptureIssue[];
};

export const getMaxDiffPercent = (result: CaptureResult): number =>
  Math.max(0, ...result.images.map((image) => image.diffPercent));

export const getCaptureResultStatus = (result: CaptureResult): string => {
  if (result.errors.length > 0) {
    return "error";
  }

  return getMaxDiffPercent(result) > result.diffThreshold ? "unstable" : "stable";
};

const formatDiffPercent = (diffPercent: number): string =>
  diffPercent.toFixed(DIFF_PERCENT_PRECISION);

export const isCaptureReportPassing = ({ results, issues }: CaptureReport): boolean =>
  issues.length === 0 && results.every((result) => getCaptureResultStatus(result) === "stable");

const formatSummary = (results: CaptureResult[]): string => {
  const stable = results.filter((result) => getCaptureResultStatus(result) === "stable").length;

  return `${stable} of ${results.length} captures stayed within their diff threshold on every run.`;
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
          formatDiffPercent(getMaxDiffPercent(result)),
          getCaptureResultStatus(result),
        ]),
      ),
    );
  }

  const details = report.results.flatMap((result) => [
    ...result.errors.map((error) => `${result.targetId} (${result.viewportName}): ${error}`),
    ...(result.blockedHosts.length > 0
      ? [
          `${result.targetId} (${result.viewportName}): blocked requests to ${result.blockedHosts.join(", ")}`,
        ]
      : []),
    ...(getCaptureResultStatus(result) === "unstable"
      ? result.images
          .filter((image) => image.file)
          .map(
            (image) =>
              `${result.targetId} (${result.viewportName}): ${image.count}x, ${formatDiffPercent(image.diffPercent)}% different: ${image.file}`,
          )
      : []),
  ]);

  if (details.length > 0) {
    sections.push(details.join("\n"));
  }

  if (report.results.some((result) => result.blockedHosts.length > 0)) {
    sections.push(BLOCKED_HOSTS_HINT);
  }

  if (report.issues.length > 0) {
    sections.push(report.issues.map((issue) => `${issue.targetId}: ${issue.message}`).join("\n"));
  }

  sections.push(formatSummary(report.results));

  return sections.join("\n\n");
};
