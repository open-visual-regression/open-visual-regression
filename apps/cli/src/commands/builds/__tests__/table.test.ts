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

describe("formatBuildsTable", () => {
  it("should render a header row and one row per build", () => {
    const table = formatBuildsTable([
      {
        id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fb",
        status: "needs_review",
        branch: "main",
        commit: "a1b2c3d4e5f6",
        project: "web",
        name: "fix: cart total rounding",
      },
    ]);

    const lines = table.split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(
      "BUILD                                 STATUS        BRANCH  COMMIT   PROJECT  NAME",
    );
    expect(lines[1]).toContain("01a092d6-b0aa-71bf-9312-dd8ef48a22fb");
    expect(lines[1]).toContain("needs_review");
    expect(lines[1]).toContain("fix: cart total rounding");
  });

  it("should truncate the commit to 7 characters", () => {
    const table = formatBuildsTable([
      {
        id: "build-1",
        status: "unchanged",
        branch: "main",
        commit: "a1b2c3d4e5f6",
        project: "web",
        name: "",
      },
    ]);

    expect(table).toContain("a1b2c3d");
    expect(table).not.toContain("a1b2c3d4");
  });

  it("should widen a column to fit its longest value", () => {
    const table = formatBuildsTable([
      {
        id: "b1",
        status: "unchanged",
        branch: "feature/a-very-long-branch-name",
        commit: "abc",
        project: "web",
        name: "",
      },
      { id: "b2", status: "unchanged", branch: "main", commit: "def", project: "web", name: "" },
    ]);

    const lines = table.split("\n");
    const branchColumnStart = lines[0]!.indexOf("BRANCH");

    expect(lines[1]!.slice(branchColumnStart)).toMatch(/^feature\/a-very-long-branch-name\s+/);
    expect(lines[2]!.slice(branchColumnStart)).toMatch(/^main\s+/);
  });
});

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
