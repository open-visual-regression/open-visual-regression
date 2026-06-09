import { Command } from "commander";
import { snapshotCommand } from "./commands/snapshot/index.js";

const program = new Command()
  .name("ovr")
  .description("Open Visual Regression CLI")
  .version("0.1.0");

program.addCommand(snapshotCommand);

program.parseAsync();
