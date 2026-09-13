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
