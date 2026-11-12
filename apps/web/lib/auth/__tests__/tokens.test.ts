import { describe, expect, it } from "@/test-utils";

import { toTokenPermissions } from "../tokens";

describe("toTokenPermissions", () => {
  it("should grant reading builds when nothing else is asked for", () => {
    expect(toTokenPermissions()).toEqual({ builds: ["read"] });
  });

  it("should keep reading builds alongside writing them", () => {
    expect(toTokenPermissions({ builds: ["write"] })).toEqual({ builds: ["read", "write"] });
  });

  it("should add reviewing without dropping reading builds", () => {
    expect(toTokenPermissions({ reviews: ["write"] })).toEqual({
      builds: ["read"],
      reviews: ["write"],
    });
  });

  it("should leave out a resource that was given no actions", () => {
    expect(toTokenPermissions({ builds: [], reviews: [] })).toEqual({ builds: ["read"] });
  });
});
