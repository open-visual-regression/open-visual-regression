import { Command } from "commander";

import { compareCommand } from "./compare";
import { getCommand } from "./get";

export const diffsCommand = new Command("diffs")
  .description("Inspect a snapshot's diff, or compare two images locally")
  .addCommand(getCommand)
  .addCommand(compareCommand);
