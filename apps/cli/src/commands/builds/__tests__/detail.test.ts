import { describe, expect, it } from "vitest";

import type { BuildDetailSchema } from "@ovr/api/contracts/builds";

import { formatBuildDetail, formatBuildOutput } from "../detail";

const BUILD: BuildDetailSchema = {
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
  canceledBy: null,
  isRebuildable: false,
  commitUrl: null,
  branchUrl: null,
};

describe("formatBuildDetail", () => {
  it("should render the core fields as label: value lines", () => {
    const output = formatBuildDetail({
      id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fb",
      status: "needs_review",
      branch: "main",
      commitSha: "a1b2c3d4e5f6",
      project: "web",
      name: "fix: cart total rounding",
      author: "tgfischer",
      createdAt: "2026-09-12T10:43:15Z",
      errorMessage: null,
      canceledBy: null,
    });

    const lines = output.split("\n");

    expect(lines).toEqual([
      "Build:   01a092d6-b0aa-71bf-9312-dd8ef48a22fb",
      "Status:  needs_review",
      "Branch:  main",
      "Commit:  a1b2c3d4e5f6",
      "Project: web",
      "Name:    fix: cart total rounding",
      "Author:  tgfischer",
      "Created: 2026-09-12T10:43:15Z",
    ]);
  });

  it("should omit error and canceled-by lines when absent", () => {
    const output = formatBuildDetail({
      id: "b1",
      status: "unchanged",
      branch: "main",
      commitSha: "abc",
      project: "web",
      name: null,
      author: null,
      createdAt: "2026-09-12T10:43:15Z",
      errorMessage: null,
      canceledBy: null,
    });

    expect(output).not.toContain("Error:");
    expect(output).not.toContain("Canceled by:");
  });

  it("should include the error message and canceler when present", () => {
    const output = formatBuildDetail({
      id: "b1",
      status: "canceled",
      branch: "main",
      commitSha: "abc",
      project: "web",
      name: null,
      author: null,
      createdAt: "2026-09-12T10:43:15Z",
      errorMessage: "artifact upload timed out",
      canceledBy: "tgfischer",
    });

    const lines = output.split("\n");

    expect(lines).toContain("Error:       artifact upload timed out");
    expect(lines).toContain("Canceled by: tgfischer");
  });
});

describe("formatBuildOutput", () => {
  it("should print the raw build as JSON when json is true", () => {
    expect(formatBuildOutput(BUILD, true)).toBe(JSON.stringify(BUILD, null, 2));
  });

  it("should print formatted detail text when json is false", () => {
    expect(formatBuildOutput(BUILD, false)).toBe(
      formatBuildDetail({
        id: BUILD.id,
        status: BUILD.status,
        branch: BUILD.branch,
        commitSha: BUILD.commitSha,
        project: BUILD.project.name,
        name: BUILD.name,
        author: BUILD.author,
        createdAt: BUILD.createdAt,
        errorMessage: BUILD.errorMessage,
        canceledBy: BUILD.canceledBy,
      }),
    );
  });
});
