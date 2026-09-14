import { ORPCError } from "@orpc/client";
import { describe, expect, it } from "vitest";

import { formatCliError } from "../errors";

describe("formatCliError", () => {
  it("should format an ORPCError with the server URL, status, code, and message", () => {
    const error = new ORPCError("NOT_FOUND", { status: 404, message: "Not Found" });

    expect(formatCliError(error, "http://localhost:3000")).toBe(
      "Request to http://localhost:3000 failed: 404 NOT_FOUND - Not Found",
    );
  });

  it("should use a plain Error's message", () => {
    const error = new Error("something went wrong");

    expect(formatCliError(error, "http://localhost:3000")).toBe("something went wrong");
  });

  it("should stringify a non-Error thrown value", () => {
    expect(formatCliError("boom", "http://localhost:3000")).toBe("boom");
  });
});
