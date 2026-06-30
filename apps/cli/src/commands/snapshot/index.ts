import { Command } from "commander";

import { storybookCommand } from "./storybook";

export const snapshotCommand = new Command("snapshot")
  .description("Run a visual regression snapshot")
  .addCommand(storybookCommand);
