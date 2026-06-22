import { vi } from "vitest";
import { describe, expect, it, render, screen } from "@/test-utils";
import { MultiLineCodeBlock } from "../MultiLineCodeBlock";
import { MultiLineCodeBlockBody } from "../MultiLineCodeBlockBody";
import { MultiLineCodeBlockCopyButton } from "../MultiLineCodeBlockCopyButton";
import { MultiLineCodeBlockLabel } from "../MultiLineCodeBlockLabel";
import { MultiLineCodeBlockFilename } from "../MultiLineCodeBlockFilename";
import { MultiLineCodeBlockHeader } from "../MultiLineCodeBlockHeader";
import { MultiLineCodeBlockLine } from "../MultiLineCodeBlockLine";
import { MultiLineCodeBlockLineCount } from "../MultiLineCodeBlockLineCount";

const LINES: [string, string] = [
  "TypeError: Cannot read properties of undefined (reading 'price')",
  "    at computeSubtotal (src/cart/total.ts:42:18)",
];

const renderCodeBlock = (props: Partial<{ wrap: boolean; showLineNumbers: boolean }> = {}) => {
  render(
    <MultiLineCodeBlock lines={LINES} {...props}>
      <MultiLineCodeBlockHeader>
        <MultiLineCodeBlockLabel>stacktrace</MultiLineCodeBlockLabel>
        <MultiLineCodeBlockFilename>cart-with-items.test.ts</MultiLineCodeBlockFilename>
        <MultiLineCodeBlockLineCount />
        <MultiLineCodeBlockCopyButton />
      </MultiLineCodeBlockHeader>
      <MultiLineCodeBlockBody>
        {LINES.map((line, index) => (
          <MultiLineCodeBlockLine key={line} lineNumber={index + 1}>
            {line}
          </MultiLineCodeBlockLine>
        ))}
      </MultiLineCodeBlockBody>
    </MultiLineCodeBlock>,
  );
};

describe("MultiLineCodeBlock", () => {
  it("should render the title, filename, and line count", () => {
    renderCodeBlock();

    expect(screen.getByText("stacktrace")).toBeVisible();
    expect(screen.getByText("cart-with-items.test.ts")).toBeVisible();
    expect(screen.getByText("2 lines")).toBeVisible();
  });

  it("should render each line with its line number by default", () => {
    renderCodeBlock();

    expect(screen.getByText("1")).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();
    expect(screen.getByText(LINES[0])).toBeVisible();
    expect(screen.getByText(LINES[1].trim())).toBeVisible();
  });

  it("should hide line numbers when showLineNumbers is false", () => {
    renderCodeBlock({ showLineNumbers: false });

    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.getByText(LINES[0])).toBeVisible();
  });

  it("should not wrap lines by default", () => {
    renderCodeBlock();

    expect(screen.getByText(LINES[0])).toHaveClass("whitespace-pre");
  });

  it("should wrap lines when wrap is true", () => {
    renderCodeBlock({ wrap: true });

    expect(screen.getByText(LINES[0])).toHaveClass("whitespace-pre-wrap");
  });

  it("should copy all lines joined by newlines to the clipboard", async ({ user }) => {
    renderCodeBlock();

    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    await user.click(screen.getByRole("button", { name: /^copy$/i }));

    expect(writeText).toHaveBeenCalledWith(LINES.join("\n"));
  });
});
