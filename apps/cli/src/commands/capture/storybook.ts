import { Command } from "commander";

import { readStoryTargets } from "@ovr/storybook-compat/manifest";

import { loadOvrConfig, resolveViewports, resolveWaitForTimeout } from "../../config";
import { describeError } from "../../errors";
import { loadWithPlaywright } from "./loadPlaywright";
import {
  formatCaptureReport,
  isCaptureReportPassing,
  type CaptureIssue,
  type CaptureReport,
} from "./report";
import type { CaptureTarget } from "./run";

const DEFAULT_REPEAT = "1";
const MAX_REPEAT = 100;

type StorybookCaptureCommandOptions = {
  dir: string;
  story?: string[];
  viewport?: string[];
  repeat: string;
  out?: string;
  cpuThrottle?: string;
  executablePath?: string;
  config?: string;
  json?: boolean;
};

const parseRepeat = (repeat: string): number => {
  const parsed = Number(repeat);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_REPEAT) {
    throw new Error(`--repeat must be an integer between 1 and ${MAX_REPEAT}.`);
  }

  return parsed;
};

const parseCpuThrottle = (cpuThrottle: string | undefined): number | undefined => {
  if (cpuThrottle === undefined) {
    return undefined;
  }

  const parsed = Number(cpuThrottle);

  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("--cpu-throttle must be a number of at least 1.");
  }

  return parsed;
};

const captureStorybook = async (
  options: StorybookCaptureCommandOptions,
): Promise<CaptureReport> => {
  const repeat = parseRepeat(options.repeat);
  const cpuThrottle = parseCpuThrottle(options.cpuThrottle);
  const config = await loadOvrConfig(process.cwd(), options.config);
  const viewports = resolveViewports(config);
  const waitForTimeout = resolveWaitForTimeout(config);
  const launchOptions = options.executablePath ? { executablePath: options.executablePath } : {};

  const stories = await readStoryTargets(options.dir);
  const knownStoryIds = new Set(stories.map((story) => story.id));
  const storyIds = options.story ?? [...knownStoryIds];
  const unknownStoryIds = storyIds.filter((storyId) => !knownStoryIds.has(storyId));

  if (unknownStoryIds.length > 0) {
    throw new Error(`Unknown stories: ${unknownStoryIds.join(", ")}`);
  }

  const [{ runCaptures }, { detectCaptureStrategy }, storyViewports] = await loadWithPlaywright(
    () =>
      Promise.all([
        import("./run"),
        import("@ovr/capture-browser/captureStrategies"),
        import("@ovr/capture-browser/storyViewports"),
      ]),
  );

  const strategy = await detectCaptureStrategy(options.dir);
  const { overrides, failures } = await storyViewports.readStoryParameterOverrides(
    options.dir,
    storyIds,
    launchOptions,
  );

  const issues: CaptureIssue[] = [];
  const targets = storyIds.flatMap((storyId): CaptureTarget[] => {
    const failure = failures.get(storyId);
    if (failure !== undefined) {
      issues.push({ targetId: storyId, message: `failed to load: ${failure}` });
      return [];
    }

    const override = overrides.get(storyId);
    if (override?.skip) {
      return [];
    }

    return storyViewports
      .resolveTargetViewports(viewports, override?.viewports)
      .map((viewport) => ({
        targetId: storyId,
        browser: viewport.browser,
        viewportName: storyViewports.toViewportName(viewport),
        viewportWidth: viewport.viewportWidth,
        viewportHeight: viewport.viewportHeight ?? 0,
        waitForTimeout: storyViewports.resolveTargetWaitForTimeout(waitForTimeout, override),
      }))
      .filter((target) => !options.viewport || options.viewport.includes(target.viewportName));
  });

  if (targets.length === 0 && issues.length === 0) {
    throw new Error("Nothing to capture: no story has a matching viewport.");
  }

  const results = await runCaptures({
    dir: options.dir,
    strategy,
    targets,
    repeat,
    outDir: options.out,
    cpuThrottle,
    launchOptions,
  });

  return { results, issues };
};

export const createStorybookCaptureCommand = (): Command =>
  new Command("storybook")
    .description("Capture stories from a Storybook static build on this machine")
    .requiredOption("-d, --dir <path>", "path to storybook-static output directory")
    .option("--story <id...>", "stories to capture (defaults to every story)")
    .option("--viewport <name...>", "only capture these viewports")
    .option("--repeat <count>", `times to capture each story (1-${MAX_REPEAT})`, DEFAULT_REPEAT)
    .option("--out <dir>", "save each distinct image to this directory")
    .option("--cpu-throttle <rate>", "slow the CPU down by this factor (Chromium only)")
    .option("--executable-path <path>", "browser executable to launch")
    .option("-c, --config <path>", "path to ovr.config file")
    .option("--json", "print results as JSON instead of a table")
    .action(async (options: StorybookCaptureCommandOptions) => {
      try {
        const report = await captureStorybook(options);

        console.log(formatCaptureReport(report, options.json));

        if (!isCaptureReportPassing(report)) {
          process.exitCode = 1;
        }
      } catch (error) {
        console.error(describeError(error));
        process.exit(1);
      }
    });
