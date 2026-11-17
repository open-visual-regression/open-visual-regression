import { describe, expect, it } from "vitest";

import { formatBuildDetail } from "../detail";

describe("formatBuildDetail", () => {
  it("should render the core fields as label: value lines", () => {
    const output = formatBuildDetail({
      id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fb",
      status: "needs_review",
      branch: "main",
      commitSha: "a1b2c3d4e5f6",
      pullRequestNumber: null,
      pullRequestUrl: null,
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

  it("should link the pull request when the build has one", () => {
    const output = formatBuildDetail({
      id: "b1",
      status: "needs_review",
      branch: "feature/cart",
      commitSha: "abc",
      pullRequestNumber: 42,
      pullRequestUrl: "https://github.com/acme/web/pull/42",
      project: "web",
      name: null,
      author: null,
      createdAt: "2026-09-12T10:43:15Z",
      errorMessage: null,
      canceledBy: null,
    });

    expect(output.split("\n")).toContain("Pull request: https://github.com/acme/web/pull/42");
  });

  it("should show the pull request number when the project has no git integration", () => {
    const output = formatBuildDetail({
      id: "b1",
      status: "needs_review",
      branch: "feature/cart",
      commitSha: "abc",
      pullRequestNumber: 42,
      pullRequestUrl: null,
      project: "web",
      name: null,
      author: null,
      createdAt: "2026-09-12T10:43:15Z",
      errorMessage: null,
      canceledBy: null,
    });

    expect(output.split("\n")).toContain("Pull request: 42");
  });

  it("should omit error and canceled-by lines when absent", () => {
    const output = formatBuildDetail({
      id: "b1",
      status: "unchanged",
      branch: "main",
      commitSha: "abc",
      pullRequestNumber: null,
      pullRequestUrl: null,
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
      pullRequestNumber: null,
      pullRequestUrl: null,
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
