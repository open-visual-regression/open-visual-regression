import { describe, expect, fireEvent, it, render, screen } from "@/test-utils";
import { Image } from "../Image";

describe("Image", () => {
  it("should show a loading indicator while the image is loading", () => {
    render(<Image src="/snapshot.png" alt="snapshot" errorFallback={<div>failed</div>} />);

    expect(screen.getByRole("status", { name: "loading" })).toBeInTheDocument();
    expect(screen.getByAltText("snapshot")).toHaveClass("invisible");
  });

  it("should hide the loading indicator and reveal the image once it loads", () => {
    render(<Image src="/snapshot.png" alt="snapshot" errorFallback={<div>failed</div>} />);

    fireEvent.load(screen.getByAltText("snapshot"));

    expect(screen.queryByRole("status", { name: "loading" })).not.toBeInTheDocument();
    expect(screen.getByAltText("snapshot")).not.toHaveClass("invisible");
  });

  it("should not get stuck showing the loading indicator when the image was already loaded before mount", () => {
    Object.defineProperty(HTMLImageElement.prototype, "complete", {
      configurable: true,
      get: () => true,
    });
    Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
      configurable: true,
      get: () => 240,
    });

    render(<Image src="/snapshot.png" alt="snapshot" errorFallback={<div>failed</div>} />);

    expect(screen.queryByRole("status", { name: "loading" })).not.toBeInTheDocument();
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
