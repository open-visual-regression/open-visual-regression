import { Command } from "commander";

import { getCommand } from "./get";

export const diffsCommand = new Command("diffs")
  .description("Inspect a snapshot's diff against its baseline")
  .addCommand(getCommand);
