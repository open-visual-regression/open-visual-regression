import { Command } from "commander";

import { countsCommand } from "./counts";
import { downloadCommand } from "./download";
import { getCommand } from "./get";
import { listCommand } from "./list";

export const snapshotsCommand = new Command("snapshots")
  .description("Inspect a build's snapshots")
  .addCommand(listCommand)
  .addCommand(countsCommand)
  .addCommand(getCommand)
  .addCommand(downloadCommand);
