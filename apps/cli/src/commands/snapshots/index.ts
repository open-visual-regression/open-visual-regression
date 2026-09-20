import { Command } from "commander";

import { countsCommand } from "./counts";
import { listCommand } from "./list";

export const snapshotsCommand = new Command("snapshots")
  .description("Inspect a build's snapshots")
  .addCommand(listCommand)
  .addCommand(countsCommand);
