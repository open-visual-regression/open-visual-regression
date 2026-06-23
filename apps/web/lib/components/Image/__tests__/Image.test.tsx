import { describe, expect, fireEvent, it, render, screen } from "@/test-utils";
import { Image } from "../Image";

describe("Image", () => {
  it("should show a skeleton while the image is loading", () => {
    const { container } = render(
      <Image src="/snapshot.png" alt="snapshot" errorFallback={<div>failed</div>} />,
    );

    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    expect(screen.getByAltText("snapshot")).toHaveClass("invisible");
  });

  it("should hide the skeleton and reveal the image once it loads", () => {
    const { container } = render(
      <Image src="/snapshot.png" alt="snapshot" errorFallback={<div>failed</div>} />,
    );

    fireEvent.load(screen.getByAltText("snapshot"));

    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeInTheDocument();
    expect(screen.getByAltText("snapshot")).not.toHaveClass("invisible");
  });

  it("should skip the skeleton when the image is already cached on mount", () => {
    Object.defineProperty(HTMLImageElement.prototype, "complete", {
      configurable: true,
      get: () => true,
    });
    Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
      configurable: true,
      get: () => 240,
    });

    const { container } = render(
      <Image src="/snapshot.png" alt="snapshot" errorFallback={<div>failed</div>} />,
    );

    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeInTheDocument();
    expect(screen.getByAltText("snapshot")).not.toHaveClass("invisible");

    Reflect.deleteProperty(HTMLImageElement.prototype, "complete");
    Reflect.deleteProperty(HTMLImageElement.prototype, "naturalWidth");
  });

  it("should render the error fallback when the image fails to load", () => {
    render(
      <Image
        src="/snapshot.png"
        alt="snapshot"
        errorFallback={<div>failed to load snapshot</div>}
      />,
    );

    fireEvent.error(screen.getByAltText("snapshot"));

    expect(screen.queryByAltText("snapshot")).not.toBeInTheDocument();
    expect(screen.getByText("failed to load snapshot")).toBeInTheDocument();
  });
});
