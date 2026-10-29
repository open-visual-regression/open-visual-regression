import { mocks } from "@ovr/mocks";

import { describe, expect, it, render, screen } from "@/test-utils";

import { GITHUB_APP_SETUP_GUIDE_URL, GithubAppSection } from "../GithubAppSection";

describe("GithubAppSection", () => {
  it("should list the installations of a connected app", () => {
    render(
      <GithubAppSection
        status={{
          status: "ok",
          app: mocks.githubApp.generateGithubApp(),
          installations: [
            mocks.githubApp.generateGithubAppInstallation(),
            mocks.githubApp.generateGithubAppInstallation({
              id: 43,
              accountLogin: "acme-labs",
              repositorySelection: "all",
              suspended: true,
            }),
          ],
        }}
      />,
    );

    expect(screen.getByText("acme-ovr")).toBeVisible();
    expect(screen.getByText("owned by acme · commit statuses: write")).toBeVisible();
    expect(screen.getByText("connected")).toBeVisible();
    expect(screen.getByText("12 repositories")).toBeVisible();
    expect(screen.getByText("all repositories")).toBeVisible();
    expect(screen.getByText("suspended")).toBeVisible();
    expect(screen.getAllByRole("link", { name: /configure/i })[0]).toHaveAttribute(
      "href",
      "https://github.com/organizations/acme/settings/installations/42",
    );
    expect(screen.getByRole("link", { name: /install on another account/i })).toHaveAttribute(
      "href",
      "https://github.com/apps/acme-ovr/installations/new",
    );
  });

  it("should prompt to install an app with no installations", () => {
    render(
      <GithubAppSection
        status={{ status: "ok", app: mocks.githubApp.generateGithubApp(), installations: [] }}
      />,
    );

    expect(screen.getByText("not installed")).toBeVisible();
    expect(screen.getByRole("link", { name: /install on github/i })).toHaveAttribute(
      "href",
      "https://github.com/apps/acme-ovr/installations/new",
    );
  });

  it("should warn when the app can't write commit statuses", () => {
    render(
      <GithubAppSection
        status={{
          status: "ok",
          app: mocks.githubApp.generateGithubApp({ permissions: { metadata: "read" } }),
          installations: [mocks.githubApp.generateGithubAppInstallation()],
        }}
      />,
    );

    expect(screen.getByText(/commit statuses: no access/)).toBeVisible();
    expect(screen.getByText(/the app can't write commit statuses/)).toBeVisible();
  });

  it("should link to the setup guide when no app is configured", () => {
    render(<GithubAppSection status={{ status: "not_configured" }} />);

    expect(screen.getByText("not configured")).toBeVisible();
    expect(screen.getByRole("link", { name: /read the setup guide/i })).toHaveAttribute(
      "href",
      GITHUB_APP_SETUP_GUIDE_URL,
    );
  });

  it("should show why the app can't be reached", () => {
    render(<GithubAppSection status={{ status: "error", error: "github responded with 500" }} />);

    expect(screen.getByText("error")).toBeVisible();
    expect(screen.getByText("github responded with 500")).toBeVisible();
  });
});
