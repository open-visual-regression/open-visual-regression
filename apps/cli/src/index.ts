import { Command } from "commander";

import pkg from "../package.json" with { type: "json" };
import { buildsCommand } from "./commands/builds";
import { snapshotCommand } from "./commands/snapshot";
import { snapshotsCommand } from "./commands/snapshots";

const program = new Command()
  .name("ovr")
  .description("Open Visual Regression CLI")
  .version(pkg.version);

program.addCommand(snapshotCommand);
program.addCommand(buildsCommand);
program.addCommand(snapshotsCommand);

program.parseAsync();
