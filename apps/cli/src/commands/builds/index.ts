import { Command } from "commander";

import { cancelCommand } from "./cancel";
import { getCommand } from "./get";
import { listCommand } from "./list";
import { rebuildCommand } from "./rebuild";

export const buildsCommand = new Command("builds")
  .description("View, cancel and rebuild builds")
  .addCommand(listCommand)
  .addCommand(getCommand)
  .addCommand(cancelCommand)
  .addCommand(rebuildCommand);
