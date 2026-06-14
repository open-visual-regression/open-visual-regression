import { vi } from "vitest";

import { describe, expect, it, render, screen } from "@/test-utils";
import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { mocks } from "@ovr/mocks";
import NavigationSlot from "../page";

vi.mock("next/headers");
vi.mock("@/lib/auth/auth");
vi.mock("@/lib/router");

const mockGetSession = vi.mocked(auth.api.getSession);
const mockGetOne = vi.mocked(serverClient.projects.getOne);

describe("NavigationSlot", () => {
  it("should render breadcrumbs for the projects root", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateUser({ name: "Jane Doe" }),
      session: mocks.session.generateSession(),
    });

    render(await NavigationSlot({ params: Promise.resolve({ pathname: undefined }) }));

    expect(screen.getByText("projects")).toBeVisible();
    expect(screen.getByLabelText("User menu for Jane Doe")).toBeVisible();
  });

  it("should resolve the project name in the breadcrumb trail", async () => {
    const project = mocks.project.generateProject({ name: "D's Construction" });
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateUser(),
      session: mocks.session.generateSession(),
    });
    mockGetOne.mockResolvedValue([null, { project }]);

    render(
      await NavigationSlot({
        params: Promise.resolve({ pathname: ["projects", project.id, "settings"] }),
      }),
    );

    expect(screen.getByText("D's Construction")).toBeVisible();
    expect(screen.getByText("settings")).toBeVisible();
  });
});
