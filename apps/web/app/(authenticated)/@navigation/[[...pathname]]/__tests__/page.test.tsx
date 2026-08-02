import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { serverClient } from "@/lib/router";
import { describe, expect, it, render, screen } from "@/test-utils";

import NavigationSlot from "../page";

vi.mock("next/headers");
vi.mock("next/navigation");
vi.mock("@/lib/router");

const mockGetOne = vi.mocked(serverClient.projects.getOne);
const mockBuildsGetOne = vi.mocked(serverClient.builds.getOne);

describe("NavigationSlot", () => {
  it("should render breadcrumbs for the projects root", async () => {
    render(
      await NavigationSlot({
        params: Promise.resolve({ pathname: undefined }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText("projects")).toBeVisible();
  });

  it("should resolve the project name in the breadcrumb trail", async () => {
    const project = mocks.project.generateProject({ name: "D's Construction" });
    mockGetOne.mockResolvedValue([null, { project }]);

    render(
      await NavigationSlot({
        params: Promise.resolve({ pathname: ["projects", project.id, "settings"] }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText("D's Construction")).toBeVisible();
    expect(screen.getByText("settings")).toBeVisible();
  });

  it("should resolve a nested build without the page declaring anything", async () => {
    const project = mocks.project.generateProject({ name: "D's Construction" });
    const build = mocks.build.generateBuild({ name: "feat: add login" });
    mockGetOne.mockResolvedValue([null, { project }]);
    mockBuildsGetOne.mockResolvedValue([null, { build }]);

    render(
      await NavigationSlot({
        params: Promise.resolve({ pathname: ["projects", project.id, "builds", build.id] }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText("D's Construction")).toBeVisible();
    expect(screen.getByText("feat: add login")).toBeVisible();
  });
});
