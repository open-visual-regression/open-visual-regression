import { vi } from "vitest";

import { describe, expect, it } from "@/test-utils";
import { serverClient } from "@/lib/router";
import { mocks } from "@ovr/mocks";
import { createORPCError } from "@/lib/testing/orpc";
import { getBreadcrumbSegments } from "../getBreadcrumbSegments";

vi.mock("@/lib/router");

const mockGetOne = vi.mocked(serverClient.projects.getOne);

describe("getBreadcrumbSegments", () => {
  it("should return the projects root segment for the projects list page", async () => {
    expect(await getBreadcrumbSegments("/projects")).toEqual([{ label: "projects" }]);
  });

  it("should humanize the new project segment", async () => {
    mockGetOne.mockResolvedValue([createORPCError("NOT_FOUND", 404), undefined]);

    expect(await getBreadcrumbSegments("/projects/new")).toEqual([
      { label: "projects", href: "/projects" },
      { label: "new" },
    ]);
  });

  it("should resolve the project name for a project page", async () => {
    const project = mocks.project.generateProject({ name: "D's Construction" });
    mockGetOne.mockResolvedValue([null, { project }]);

    expect(await getBreadcrumbSegments(`/projects/${project.id}`)).toEqual([
      { label: "projects", href: "/projects" },
      { label: "D's Construction" },
    ]);
  });

  it("should resolve the project name for a nested project page", async () => {
    const project = mocks.project.generateProject({ name: "D's Construction" });
    mockGetOne.mockResolvedValue([null, { project }]);

    expect(await getBreadcrumbSegments(`/projects/${project.id}/settings`)).toEqual([
      { label: "projects", href: "/projects" },
      { label: "D's Construction", href: `/projects/${project.id}` },
      { label: "settings" },
    ]);
  });

  it("should fall back to the raw segment when the project cannot be resolved", async () => {
    mockGetOne.mockResolvedValue([createORPCError("NOT_FOUND", 404), undefined]);

    expect(await getBreadcrumbSegments("/projects/unknown-id")).toEqual([
      { label: "projects", href: "/projects" },
      { label: "unknown id" },
    ]);
  });

  it("should humanize static segments outside of projects", async () => {
    expect(await getBreadcrumbSegments("/settings/profile")).toEqual([
      { label: "settings", href: "/settings" },
      { label: "profile" },
    ]);
  });
});
