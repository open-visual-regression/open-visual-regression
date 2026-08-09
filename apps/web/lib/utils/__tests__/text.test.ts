import { describe, expect, it } from "@/test-utils";

import { truncate } from "../text";

describe("truncate", () => {
  it("should return the value unchanged when it is within the max length", () => {
    expect(truncate("main", 24)).toBe("main");
  });

  it("should return the value unchanged when it is exactly the max length", () => {
    expect(truncate("a".repeat(24), 24)).toBe("a".repeat(24));
  });

  it("should truncate and append an ellipsis when the value exceeds the max length", () => {
    expect(truncate("feature/a-very-long-branch-name", 24)).toBe("feature/a-very-long-bran…");
  });
});
