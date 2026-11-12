import { Command } from "commander";

import { getCommand } from "./get";
import { createVoteCommand } from "./vote";

export const diffsCommand = new Command("diffs")
  .description("Inspect and review a snapshot's diff against its baseline")
  .addCommand(getCommand)
  .addCommand(createVoteCommand("approve"))
  .addCommand(createVoteCommand("reject"));
