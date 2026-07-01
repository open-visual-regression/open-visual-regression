import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { describe, expect, it, render, screen } from "@/test-utils";

import NavigationSlot from "../page";

vi.mock("next/headers");
vi.mock("next/navigation");
vi.mock("@/lib/auth/auth");
vi.mock("@/lib/router");

const mockGetSession = vi.mocked(auth.api.getSession);
const mockGetOne = vi.mocked(serverClient.projects.getOne);
const mockList = vi.mocked(serverClient.projects.list);
const mockCount = vi.mocked(serverClient.projects.count);
const mockBuildsList = vi.mocked(serverClient.builds.list);

mockList.mockResolvedValue([null, { projects: [] }]);
mockCount.mockResolvedValue([null, { total: 0 }]);
mockBuildsList.mockResolvedValue([null, { builds: [], total: 0, nextCursor: null }]);

describe("NavigationSlot", () => {
  it("should render breadcrumbs for the projects root", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ name: "Jane Doe" }),
      session: mocks.session.generateSession(),
    });

    render(
      await NavigationSlot({
        params: Promise.resolve({ pathname: undefined }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText("projects")).toBeVisible();
    expect(screen.getByLabelText("User menu for Jane Doe")).toBeVisible();
  });

  it("should resolve the project name in the breadcrumb trail", async () => {
    const project = mocks.project.generateProject({ name: "D's Construction" });
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser(),
      session: mocks.session.generateSession(),
    });
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
});
