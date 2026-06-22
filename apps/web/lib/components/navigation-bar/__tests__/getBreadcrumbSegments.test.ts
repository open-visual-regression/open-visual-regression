import { vi } from "vitest";

import { describe, expect, it } from "@/test-utils";
import { serverClient } from "@/lib/router";
import { mocks } from "@ovr/mocks";
import { createORPCError } from "@/lib/testing/orpc";
import { getBreadcrumbSegments } from "../getBreadcrumbSegments";

vi.mock("@/lib/router");

const mockGetOne = vi.mocked(serverClient.projects.getOne);
const mockBuildsGetOne = vi.mocked(serverClient.builds.getOne);
const mockSnapshotsGetOne = vi.mocked(serverClient.snapshots.getOne);

describe("getBreadcrumbSegments", () => {
  it("should return the projects root segment for the projects list page", async () => {
    expect(await getBreadcrumbSegments([])).toEqual([{ label: "projects" }]);
  });

  it("should humanize the new project segment", async () => {
    mockGetOne.mockResolvedValue([createORPCError("NOT_FOUND", 404), undefined]);

    expect(await getBreadcrumbSegments(["projects", "new"])).toEqual([
      { label: "projects", href: "/projects" },
      { label: "new" },
    ]);
  });

  it("should resolve the project name for a project page", async () => {
    const project = mocks.project.generateProject({ name: "D's Construction" });
    mockGetOne.mockResolvedValue([null, { project }]);

    expect(await getBreadcrumbSegments(["projects", project.id])).toEqual([
      { label: "projects", href: "/projects" },
      { label: "D's Construction" },
    ]);
  });

  it("should resolve the project name for a nested project page", async () => {
    const project = mocks.project.generateProject({ name: "D's Construction" });
    mockGetOne.mockResolvedValue([null, { project }]);

    expect(await getBreadcrumbSegments(["projects", project.id, "settings"])).toEqual([
      { label: "projects", href: "/projects" },
      { label: "D's Construction", href: `/projects/${project.id}` },
      { label: "settings" },
    ]);
  });

  it("should fall back to the raw segment when the project cannot be resolved", async () => {
    mockGetOne.mockResolvedValue([createORPCError("NOT_FOUND", 404), undefined]);

    expect(await getBreadcrumbSegments(["projects", "unknown-id"])).toEqual([
      { label: "projects", href: "/projects" },
      { label: "unknown-id" },
    ]);
  });

  it("should humanize static segments outside of projects", async () => {
    expect(await getBreadcrumbSegments(["settings", "profile"])).toEqual([
      { label: "settings", href: "/settings" },
      { label: "profile" },
    ]);
  });

  it("should filter the builds segment and resolve the build name with a correct href", async () => {
    const project = mocks.project.generateProject({ name: "D's Construction" });
    const build = mocks.build.generateBuild({ name: "feat: add login" });
    mockGetOne.mockResolvedValue([null, { project }]);
    mockBuildsGetOne.mockResolvedValue([null, { build }]);

    expect(await getBreadcrumbSegments(["projects", project.id, "builds", build.id])).toEqual([
      { label: "projects", href: "/projects" },
      { label: "D's Construction", href: `/projects/${project.id}` },
      { label: "feat: add login" },
    ]);
  });

  it("should filter the snapshots segment and resolve the snapshot title with a correct href", async () => {
    const project = mocks.project.generateProject({ name: "D's Construction" });
    const build = mocks.build.generateBuild({ name: "feat: add login" });
    const snapshot = mocks.build.generateBuildSnapshot({
      targetTitle: "Home Page",
      targetName: "homepage",
    });
    mockGetOne.mockResolvedValue([null, { project }]);
    mockBuildsGetOne.mockResolvedValue([null, { build }]);
    mockSnapshotsGetOne.mockResolvedValue([
      null,
      {
        snapshot: {
          id: snapshot.id,
          browser: snapshot.browser,
          viewportWidth: snapshot.viewportWidth,
          viewportHeight: snapshot.viewportHeight,
          targetName: snapshot.targetName,
          targetTitle: snapshot.targetTitle,
          imagePath: snapshot.imagePath,
          status: snapshot.status,
          errorLogs: [],
        },
      },
    ]);

    expect(
      await getBreadcrumbSegments([
        "projects",
        project.id,
        "builds",
        build.id,
        "snapshots",
        snapshot.id,
      ]),
    ).toEqual([
      { label: "projects", href: "/projects" },
      { label: "D's Construction", href: `/projects/${project.id}` },
      {
        label: "feat: add login",
        href: `/projects/${project.id}/builds/${build.id}`,
      },
      { label: "Home Page homepage" },
    ]);
  });

  it("should fall back to the raw id when the build or snapshot cannot be resolved", async () => {
    const project = mocks.project.generateProject({ name: "D's Construction" });
    mockGetOne.mockResolvedValue([null, { project }]);
    mockBuildsGetOne.mockResolvedValue([createORPCError("NOT_FOUND", 404), undefined]);

    expect(
      await getBreadcrumbSegments(["projects", project.id, "builds", "unknown-build-id"]),
    ).toEqual([
      { label: "projects", href: "/projects" },
      { label: "D's Construction", href: `/projects/${project.id}` },
      { label: "unknown-build-id" },
    ]);
  });
});
