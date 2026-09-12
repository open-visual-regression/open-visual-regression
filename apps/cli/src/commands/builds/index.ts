import { Command } from "commander";

import { listCommand } from "./list";

export const buildsCommand = new Command("builds")
  .description("Inspect builds")
  .addCommand(listCommand);
