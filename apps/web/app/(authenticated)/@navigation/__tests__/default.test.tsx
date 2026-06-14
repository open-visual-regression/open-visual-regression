import { vi } from "vitest";
import { headers } from "next/headers";

import { describe, expect, it, render, screen } from "@/test-utils";
import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { mocks } from "@ovr/mocks";
import NavigationPage from "../default";

vi.mock("next/headers");
vi.mock("@/lib/auth/auth");
vi.mock("@/lib/router");

const mockGetSession = vi.mocked(auth.api.getSession);
const mockGetOne = vi.mocked(serverClient.projects.getOne);

describe("NavigationPage", () => {
  it("should render breadcrumbs for the current pathname", async () => {
    vi.mocked(headers).mockResolvedValue(new Headers({ "x-pathname": "/projects" }));
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateUser({ name: "Jane Doe" }),
      session: mocks.session.generateSession(),
    });

    render(await NavigationPage());

    expect(screen.getByText("projects")).toBeVisible();
    expect(screen.getByLabelText("User menu for Jane Doe")).toBeVisible();
  });

  it("should resolve the project name in the breadcrumb trail", async () => {
    const project = mocks.project.generateProject({ name: "D's Construction" });
    vi.mocked(headers).mockResolvedValue(
      new Headers({ "x-pathname": `/projects/${project.id}/settings` }),
    );
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateUser(),
      session: mocks.session.generateSession(),
    });
    mockGetOne.mockResolvedValue([null, { project }]);

    render(await NavigationPage());

    expect(screen.getByText("D's Construction")).toBeVisible();
    expect(screen.getByText("settings")).toBeVisible();
  });

  it("should error when the pathname header is missing", async () => {
    vi.mocked(headers).mockResolvedValue(new Headers());

    await expect(NavigationPage()).rejects.toThrow();
  });
});
