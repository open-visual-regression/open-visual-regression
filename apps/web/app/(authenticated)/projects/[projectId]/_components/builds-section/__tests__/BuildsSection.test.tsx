import { describe, expect, it, render, screen } from "@/test-utils";
import { mocks } from "@ovr/mocks";
import { BuildsSection } from "../BuildsSection";

describe("BuildsSection", () => {
  it("should show an empty state when there are no builds", () => {
    render(<BuildsSection builds={[]} />);
    expect(screen.getByRole("heading", { name: "no builds yet" })).toBeVisible();
  });

  it("should render a row for each build", () => {
    const build = mocks.build.generateBuild({
      name: "fix: cart total rounding",
      branch: "pr/482",
    });
    render(<BuildsSection builds={[build]} />);

    expect(screen.getByRole("cell", { name: /fix: cart total rounding/ })).toBeVisible();
    expect(screen.getByRole("cell", { name: "pr/482" })).toBeVisible();
  });

  it("should show the short commit sha when the build has no name", () => {
    const build = mocks.build.generateBuild({ name: null, commitSha: "4f2a91e1234567890" });
    render(<BuildsSection builds={[build]} />);

    expect(screen.getByRole("cell", { name: /4f2a91e/ })).toBeVisible();
  });

  it("should show a passed build's status as 'passed'", () => {
    const build = mocks.build.generateBuild({ status: "passed" });
    render(<BuildsSection builds={[build]} />);

    expect(screen.getByRole("cell", { name: "passed" })).toBeVisible();
  });

  it("should show a needs_review build's status as 'needs review'", () => {
    const build = mocks.build.generateBuild({ status: "needs_review" });
    render(<BuildsSection builds={[build]} />);

    expect(screen.getByRole("cell", { name: "needs review" })).toBeVisible();
  });

  it("should show an error build's status as 'error'", () => {
    const build = mocks.build.generateBuild({ status: "error" });
    render(<BuildsSection builds={[build]} />);

    expect(screen.getByRole("cell", { name: "error" })).toBeVisible();
  });

  it("should show a queued build's status as 'queued'", () => {
    const build = mocks.build.generateBuild({ status: "queued" });
    render(<BuildsSection builds={[build]} />);

    expect(screen.getByRole("cell", { name: "queued" })).toBeVisible();
  });

  it("should show a relative time for a build created recently", () => {
    const build = mocks.build.generateBuild({
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    });
    render(<BuildsSection builds={[build]} />);

    expect(screen.getByRole("cell", { name: "5 minutes ago" })).toBeVisible();
  });

  it("should link each row to its run detail page", () => {
    const build = mocks.build.generateBuild({ commitSha: "4f2a91e1234567890" });
    render(<BuildsSection builds={[build]} />);

    expect(screen.getByRole("link", { name: /view build 4f2a91e/i })).toHaveAttribute(
      "href",
      `/projects/${build.project.id}/builds/${build.id}`,
    );
  });
});
