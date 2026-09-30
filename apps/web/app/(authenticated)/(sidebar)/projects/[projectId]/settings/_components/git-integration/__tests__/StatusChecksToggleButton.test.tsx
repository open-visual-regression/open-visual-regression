import { vi } from "vitest";

import { describe, expect, it, render, screen } from "@/test-utils";

import { StatusChecksToggleButton } from "../StatusChecksToggleButton";

vi.mock("@/lib/router");
vi.mock("next/navigation");

describe("StatusChecksToggleButton", () => {
  it("should show disable when checks are enabled", () => {
    render(<StatusChecksToggleButton projectId="project-id" enabled />);

    expect(screen.getByRole("button", { name: /^disable$/i })).toBeVisible();
    expect(screen.queryByRole("button", { name: /^enable$/i })).not.toBeInTheDocument();
  });

  it("should show enable when checks are disabled", () => {
    render(<StatusChecksToggleButton projectId="project-id" enabled={false} />);

    expect(screen.getByRole("button", { name: /^enable$/i })).toBeVisible();
    expect(screen.queryByRole("button", { name: /^disable$/i })).not.toBeInTheDocument();
  });
});
