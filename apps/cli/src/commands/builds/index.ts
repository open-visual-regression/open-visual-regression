import { Command } from "commander";

import { getCommand } from "./get";
import { listCommand } from "./list";

export const buildsCommand = new Command("builds")
  .description("View build status")
  .addCommand(listCommand)
  .addCommand(getCommand);
