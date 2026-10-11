import { Command } from "commander";

import { createStorybookCaptureCommand } from "./storybook";

export const captureCommand = new Command("capture")
  .description("Capture a build on this machine to check its screenshots are stable")
  .addCommand(createStorybookCaptureCommand());
