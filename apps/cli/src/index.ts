import { Command } from "commander";

import pkg from "../package.json" with { type: "json" };
import { buildsCommand } from "./commands/builds";
import { deprecatedSnapshotCommand } from "./commands/deprecatedSnapshot";
import { diffsCommand } from "./commands/diffs";
import { snapshotsCommand } from "./commands/snapshots";
import { uploadCommand } from "./commands/upload";

const program = new Command()
  .name("ovr")
  .description("Open Visual Regression CLI")
  .version(pkg.version);

program.addCommand(uploadCommand);
program.addCommand(buildsCommand);
program.addCommand(snapshotsCommand);
program.addCommand(diffsCommand);
program.addCommand(deprecatedSnapshotCommand);

program.parseAsync();
