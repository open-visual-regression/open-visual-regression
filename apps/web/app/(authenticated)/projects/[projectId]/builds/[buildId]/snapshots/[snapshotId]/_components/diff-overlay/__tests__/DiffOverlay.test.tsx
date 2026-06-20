import { describe, expect, it, render, screen } from "@/test-utils";
import { DiffOverlay, type DiffOverlayProps } from "../DiffOverlay";

const renderComponent = (props: Partial<DiffOverlayProps> = {}) =>
  render(
    <DiffOverlay
      label="new"
      imagePath="snapshot.png"
      diffImagePath="diff.png"
      alt="snapshot of Button"
      {...props}
    />,
  );

describe("DiffOverlay", () => {
  it("should render the snapshot and diff images, with the diff switch on by default", () => {
    renderComponent();

    expect(screen.getByRole("img", { name: "snapshot of Button" })).toBeVisible();
    expect(screen.getByRole("img", { name: "diff overlay of snapshot of Button" })).toBeVisible();
    expect(screen.getByRole("switch", { checked: true })).toBeVisible();
  });

  it("should toggle the switch off when clicked", async ({ user }) => {
    renderComponent();

    await user.click(screen.getByRole("switch", { checked: true }));

    expect(screen.getByRole("switch", { checked: false })).toBeVisible();
  });

  it("should show a placeholder when there is no snapshot image", () => {
    renderComponent({ imagePath: null });

    expect(screen.getByText("no preview")).toBeVisible();
    expect(screen.queryByRole("img", { name: "snapshot of Button" })).not.toBeInTheDocument();
  });
});
