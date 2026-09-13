import { describe, expect, it } from "vitest";

import type { BuildSchema } from "@ovr/api/contracts/builds";

import { formatBuildsOutput, formatBuildsTable } from "../table";

const BUILD: BuildSchema = {
  id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fb",
  project: { id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fc", name: "web" },
  branch: "main",
  commitSha: "a1b2c3d4e5f6",
  name: "fix: cart total rounding",
  author: "tgfischer",
  errorMessage: null,
  status: "needs_review",
  buildType: "storybook",
  createdAt: "2026-09-12T10:43:15Z",
};

describe("formatBuildsOutput", () => {
  it("should print the raw builds as JSON when json is true", () => {
    expect(formatBuildsOutput([BUILD], true)).toBe(JSON.stringify([BUILD], null, 2));
  });

  it("should print an empty JSON array when json is true and there are no builds", () => {
    expect(formatBuildsOutput([], true)).toBe("[]");
  });

  it("should print 'No builds found.' when json is false and there are no builds", () => {
    expect(formatBuildsOutput([], false)).toBe("No builds found.");
  });

  it("should print a table when json is false and there are builds", () => {
    expect(formatBuildsOutput([BUILD], false)).toBe(
      formatBuildsTable([
        {
          id: BUILD.id,
          status: BUILD.status,
          branch: BUILD.branch,
          commit: BUILD.commitSha,
          project: BUILD.project.name,
          name: BUILD.name ?? "",
        },
      ]),
    );
  });
});
