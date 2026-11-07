import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { headers } from "next/headers";
import { usePathname } from "next/navigation";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { auth } from "@/lib/auth/auth";
import { orpcServerClient } from "@/lib/orpc/server";
import { serverClient } from "@/lib/router";
import { REQUEST_PATH_HEADER } from "@/lib/utils/redirects";
import { describe, expect, it, render, screen } from "@/test-utils";

import { NavigationBarContainer } from "../NavigationBarContainer";

vi.mock("next/headers");
vi.mock("next/navigation");
vi.mock("@/lib/auth/auth");
vi.mock("@/lib/router");
vi.mock("@/lib/orpc/server");

const mockHeaders = vi.mocked(headers);
const mockUsePathname = vi.mocked(usePathname);
const mockGetSession = vi.mocked(auth.api.getSession);
const mockGetProject = vi.mocked(orpcServerClient.projects.getOne);
const mockList = vi.mocked(serverClient.projects.list);
const mockCount = vi.mocked(serverClient.projects.count);
const mockBuildsList = vi.mocked(serverClient.builds.list);

mockList.mockResolvedValue([null, { projects: [], nextCursor: null }]);
mockCount.mockResolvedValue([null, { total: 0 }]);
mockBuildsList.mockResolvedValue([null, { builds: [], total: 0, nextCursor: null }]);

const renderAtPath = async (pathname: string) => {
  mockHeaders.mockResolvedValue(new Headers({ [REQUEST_PATH_HEADER]: pathname }));
  mockUsePathname.mockReturnValue(pathname);

  return render(await NavigationBarContainer(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
    ),
  });
};

describe("NavigationBarContainer", () => {
  it("should render breadcrumbs for the overview page", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ name: "Jane Doe" }),
      session: mocks.session.generateSession(),
    });

    await renderAtPath("/");

    expect(screen.getByText("overview")).toBeVisible();
    expect(screen.getByLabelText("User menu for Jane Doe")).toBeVisible();
  });

  it("should resolve the project name for the requested path on the server", async () => {
    const project = mocks.project.generateProject({ name: "D's Construction" });
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser(),
      session: mocks.session.generateSession(),
    });
    mockGetProject.mockResolvedValue({ project });

    await renderAtPath(`/projects/${project.id}/settings`);

    expect(screen.getByRole("link", { name: "D's Construction" })).toBeVisible();
    expect(screen.getByText("settings")).toBeVisible();
  });
});
