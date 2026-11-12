import { Command } from "commander";

import { countsCommand } from "./counts";
import { getCommand } from "./get";
import { historyCommand } from "./history";
import { listCommand } from "./list";
import { rebuildCommand } from "./rebuild";

export const snapshotsCommand = new Command("snapshots")
  .description("Inspect and rebuild a build's snapshots")
  .addCommand(listCommand)
  .addCommand(countsCommand)
  .addCommand(getCommand)
  .addCommand(historyCommand)
  .addCommand(rebuildCommand);
