import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MultiLineCodeBlock } from "../MultiLineCodeBlock";
import { MultiLineCodeBlockBody } from "../MultiLineCodeBlockBody";
import { MultiLineCodeBlockCopyButton } from "../MultiLineCodeBlockCopyButton";
import { MultiLineCodeBlockFilename } from "../MultiLineCodeBlockFilename";
import { MultiLineCodeBlockHeader } from "../MultiLineCodeBlockHeader";
import { MultiLineCodeBlockLabel } from "../MultiLineCodeBlockLabel";
import { MultiLineCodeBlockLine } from "../MultiLineCodeBlockLine";
import { MultiLineCodeBlockLineCount } from "../MultiLineCodeBlockLineCount";

const stackTraceTone = (index: number) => {
  if (index === 0) {
    return "error";
  }
  return index <= 2 ? "default" : "muted";
};

const STACK_TRACE = [
  "TypeError: Cannot read properties of undefined (reading 'price')",
  "    at computeSubtotal (src/cart/total.ts:42:18)",
  "    at CartSummary (src/components/CartSummary.tsx:88:24)",
  "    at renderWithHooks (node_modules/react-dom/cjs/react-dom.dev.js:14985)",
  "    at mountIndeterminateComponent (.../react-dom.dev.js:17811)",
  "    at beginWork (.../react-dom.dev.js:19049)",
];

const meta: Meta<typeof MultiLineCodeBlock> = {
  title: "Web/MultiLineCodeBlock",
  component: MultiLineCodeBlock,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MultiLineCodeBlock>;

export const WithLineNumbers: Story = {
  render: () => (
    <div className="w-150 p-6">
      <MultiLineCodeBlock lines={STACK_TRACE}>
        <MultiLineCodeBlockHeader>
          <MultiLineCodeBlockLabel>stacktrace</MultiLineCodeBlockLabel>
          <MultiLineCodeBlockFilename>cart-with-items.test.ts</MultiLineCodeBlockFilename>
          <MultiLineCodeBlockLineCount />
          <MultiLineCodeBlockCopyButton />
        </MultiLineCodeBlockHeader>
        <MultiLineCodeBlockBody>
          {STACK_TRACE.map((line, index) => (
            <MultiLineCodeBlockLine key={line} lineNumber={index + 1} tone={stackTraceTone(index)}>
              {line}
            </MultiLineCodeBlockLine>
          ))}
        </MultiLineCodeBlockBody>
      </MultiLineCodeBlock>
    </div>
  ),
};

export const WithoutLineNumbers: Story = {
  render: () => (
    <div className="w-150 p-6">
      <MultiLineCodeBlock lines={STACK_TRACE} showLineNumbers={false}>
        <MultiLineCodeBlockHeader>
          <MultiLineCodeBlockLabel>stacktrace</MultiLineCodeBlockLabel>
          <MultiLineCodeBlockFilename>cart-with-items.test.ts</MultiLineCodeBlockFilename>
          <MultiLineCodeBlockLineCount />
          <MultiLineCodeBlockCopyButton />
        </MultiLineCodeBlockHeader>
        <MultiLineCodeBlockBody>
          {STACK_TRACE.map((line, index) => (
            <MultiLineCodeBlockLine key={line} lineNumber={index + 1} tone={stackTraceTone(index)}>
              {line}
            </MultiLineCodeBlockLine>
          ))}
        </MultiLineCodeBlockBody>
      </MultiLineCodeBlock>
    </div>
  ),
};

export const Wrapped: Story = {
  render: () => (
    <div className="w-80 p-6">
      <MultiLineCodeBlock
        wrap
        lines={[
          "ovr run --project checkout-flow --branch pr/482 --viewport 1280x800 --browser chromium-117 --baseline main",
        ]}
      >
        <MultiLineCodeBlockHeader>
          <MultiLineCodeBlockLabel>command</MultiLineCodeBlockLabel>
          <MultiLineCodeBlockLineCount />
          <MultiLineCodeBlockCopyButton />
        </MultiLineCodeBlockHeader>
        <MultiLineCodeBlockBody>
          <MultiLineCodeBlockLine lineNumber={1}>
            ovr run --project checkout-flow --branch pr/482 --viewport 1280x800 --browser
            chromium-117 --baseline main
          </MultiLineCodeBlockLine>
        </MultiLineCodeBlockBody>
      </MultiLineCodeBlock>
    </div>
  ),
};
