import { ORPCError } from "@orpc/client";
import { describe, expect, it } from "vitest";

import { RequestTimeoutError } from "../client";
import { CliStepError, formatCliError, UnsupportedByServerError } from "../errors";

describe("formatCliError", () => {
  it("should format an ORPCError with the server URL, status, code, and message", () => {
    const error = new ORPCError("NOT_FOUND", { status: 404, message: "Not Found" });

    expect(formatCliError(error, "http://localhost:3000")).toBe(
      "Request to http://localhost:3000 failed: 404 NOT_FOUND - Not Found",
    );
  });

  it("should ask to upgrade a server that does not support the command", () => {
    expect(formatCliError(new UnsupportedByServerError("0.10.0"), "http://localhost:3000")).toBe(
      "The server at http://localhost:3000 (version 0.10.0) does not support this command. Upgrade the server to use it.",
    );
  });

  it("should leave out the version of a server that does not report one", () => {
    expect(formatCliError(new UnsupportedByServerError(null), "http://localhost:3000")).toBe(
      "The server at http://localhost:3000 does not support this command. Upgrade the server to use it.",
    );
  });

  it("should use a plain Error's message", () => {
    const error = new Error("something went wrong");

    expect(formatCliError(error, "http://localhost:3000")).toBe("something went wrong");
  });

  it("should stringify a non-Error thrown value", () => {
    expect(formatCliError("boom", "http://localhost:3000")).toBe("boom");
  });

  it("should name the unreachable server and include the network cause", () => {
    const cause = Object.assign(new Error("other side closed"), { code: "UND_ERR_SOCKET" });
    const error = new TypeError("fetch failed", { cause });

    expect(formatCliError(error, "http://localhost:3000")).toBe(
      "Could not reach http://localhost:3000: fetch failed: other side closed (UND_ERR_SOCKET)",
    );
  });

  it("should name the step that failed", () => {
    const error = new CliStepError("creating the build", new RequestTimeoutError(60_000));

    expect(formatCliError(error, "http://localhost:3000")).toBe(
      "Failed while creating the build: no response after 60s",
    );
  });

  it("should include the server response for a failed step", () => {
    const error = new CliStepError(
      "confirming the upload",
      new ORPCError("CONFLICT", { status: 409, message: "this build has already failed" }),
    );

    expect(formatCliError(error, "http://localhost:3000")).toBe(
      "Failed while confirming the upload: Request to http://localhost:3000 failed: 409 CONFLICT - this build has already failed",
    );
  });
});
