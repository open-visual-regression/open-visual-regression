import { Command } from "commander";

import { createStorybookCommand } from "./storybook";

export const uploadCommand = new Command("upload")
  .description("Upload a build to snapshot")
  .addCommand(createStorybookCommand());
