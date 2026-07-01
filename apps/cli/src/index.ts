import { Command } from "commander";

import pkg from "../package.json" with { type: "json" };
import { snapshotCommand } from "./commands/snapshot";

const program = new Command()
  .name("ovr")
  .description("Open Visual Regression CLI")
  .version(pkg.version);

program.addCommand(snapshotCommand);

program.parseAsync();
