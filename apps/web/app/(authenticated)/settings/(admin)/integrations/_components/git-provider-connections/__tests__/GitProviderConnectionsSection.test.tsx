import { mocks } from "@ovr/mocks";

import { describe, expect, it, render, screen } from "@/test-utils";

import { GitProviderConnectionsSection } from "../GitProviderConnectionsSection";

const okStatus = mocks.gitProvider.generateProviderConnections().status as Extract<
  ReturnType<typeof mocks.gitProvider.generateProviderConnections>["status"],
  { status: "ok" }
>;

describe("GitProviderConnectionsSection", () => {
  it("should list a provider's connections", () => {
    render(
      <GitProviderConnectionsSection
        connections={mocks.gitProvider.generateProviderConnections({
          status: {
            ...okStatus,
            connections: [
              mocks.gitProvider.generateConnection(),
              mocks.gitProvider.generateConnection({
                id: "43",
                name: "acme-labs",
                repositoryCount: 1,
                warnings: ["suspended"],
              }),
            ],
          },
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: "github app" })).toBeVisible();
    expect(screen.getByText("acme-ovr")).toBeVisible();
    expect(screen.getByText("owned by acme · commit statuses: write")).toBeVisible();
    expect(screen.getByText("connected")).toBeVisible();
    expect(screen.getByText("12 repositories")).toBeVisible();
    expect(screen.getByText("1 repository")).toBeVisible();
    expect(screen.getByText("suspended")).toBeVisible();
    expect(screen.getAllByRole("link", { name: /manage/i })[0]).toHaveAttribute(
      "href",
      "https://github.com/organizations/acme/settings/installations/42",
    );
    expect(screen.getByRole("link", { name: /add another connection/i })).toHaveAttribute(
      "href",
      "https://github.com/apps/acme-ovr/installations/new",
    );
  });

  it("should prompt to add the first connection", () => {
    render(
      <GitProviderConnectionsSection
        connections={mocks.gitProvider.generateProviderConnections({
          status: { ...okStatus, connections: [] },
        })}
      />,
    );

    expect(screen.getByText("not connected")).toBeVisible();
    expect(screen.getByRole("link", { name: /add a connection/i })).toBeVisible();
  });

  it("should show the provider's warnings", () => {
    render(
      <GitProviderConnectionsSection
        connections={mocks.gitProvider.generateProviderConnections({
          status: { ...okStatus, warnings: ["the app can't write commit statuses."] },
        })}
      />,
    );

    expect(screen.getByText("the app can't write commit statuses.")).toBeVisible();
  });

  it("should link to the setup guide when the provider isn't configured", () => {
    render(
      <GitProviderConnectionsSection
        connections={mocks.gitProvider.generateProviderConnections({
          status: { status: "not_configured" },
        })}
      />,
    );

    expect(screen.getByText("not configured")).toBeVisible();
    expect(screen.getByRole("link", { name: /read the setup guide/i })).toHaveAttribute(
      "href",
      "https://docs.openvisualregression.com/self-hosting/github-app",
    );
  });

  it("should show why the provider can't be reached", () => {
    render(
      <GitProviderConnectionsSection
        connections={mocks.gitProvider.generateProviderConnections({
          status: { status: "error", error: "github responded with 500" },
        })}
      />,
    );

    expect(screen.getByText("error")).toBeVisible();
    expect(screen.getByText("github responded with 500")).toBeVisible();
  });
});
