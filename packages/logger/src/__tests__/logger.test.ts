import { readFileSync } from "node:fs";

import { vi } from "vitest";

import { createLogger, createRootLogger } from "../index";
import { describe, expect, test } from "./fixtures";

describe("logger", () => {
  describe("createRootLogger", () => {
    test("should default to info level", ({ filePath }) => {
      const log = createRootLogger({ filePath });

      expect(log.level).toBe("info");
    });

    test("should respect LOG_LEVEL from the environment", ({ filePath }) => {
      vi.stubEnv("LOG_LEVEL", "debug");

      const log = createRootLogger({ filePath });

      expect(log.level).toBe("debug");
    });

    test("should write log lines to the configured file sink", ({ filePath }) => {
      const log = createRootLogger({ filePath });

      log.info("hello from test");

      expect(readFileSync(filePath, "utf-8")).toContain("hello from test");
    });

    test("should write the level as its label", ({ filePath }) => {
      const log = createRootLogger({ filePath });

      log.error("something broke");

      const line = JSON.parse(readFileSync(filePath, "utf-8").trim());
      expect(line.level).toBe("error");
    });

    test("should not write lines below the configured level", ({ filePath }) => {
      const log = createRootLogger({ filePath, level: "warn" });

      log.info("too quiet");
      log.warn("loud enough");

      const contents = readFileSync(filePath, "utf-8");
      expect(contents).not.toContain("too quiet");
      expect(contents).toContain("loud enough");
    });
  });

  describe("createLogger", () => {
    test("should return a child logger with a name binding", () => {
      const log = createLogger("test-module");

      expect(log.bindings()).toMatchObject({ name: "test-module" });
    });
  });
});
