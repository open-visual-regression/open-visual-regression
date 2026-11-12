import { Command } from "commander";

import { cancelCommand } from "./cancel";
import { getCommand } from "./get";
import { listCommand } from "./list";
import { rebuildCommand } from "./rebuild";
import { createVoteCommand } from "./vote";

export const buildsCommand = new Command("builds")
  .description("View, cancel, rebuild and review builds")
  .addCommand(listCommand)
  .addCommand(getCommand)
  .addCommand(cancelCommand)
  .addCommand(rebuildCommand)
  .addCommand(createVoteCommand("approve"))
  .addCommand(createVoteCommand("reject"));
