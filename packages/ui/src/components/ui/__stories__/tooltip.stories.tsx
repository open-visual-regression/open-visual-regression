import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "UI/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

type TooltipSide = NonNullable<React.ComponentProps<typeof TooltipContent>["side"]>;
type TooltipAlign = NonNullable<React.ComponentProps<typeof TooltipContent>["align"]>;

const SIDES: TooltipSide[] = ["top", "bottom", "left", "right", "inline-start", "inline-end"];
const ALIGNMENTS: TooltipAlign[] = ["start", "center", "end"];

export const Default: Story = {
  render: () => (
    <div className="flex min-h-[220px] items-center justify-center p-6">
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger render={<Button variant="outline" color="neutral" size="sm" />}>
            Rebuild
          </TooltipTrigger>
          <TooltipContent>Re-run this build against the same baselines.</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  ),
};

export const Positions: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-x-32 gap-y-10 p-16">
      {SIDES.flatMap((side) =>
        ALIGNMENTS.map((align) => (
          <div key={`${side}-${align}`} className="flex flex-col items-center gap-2">
            <div className="flex h-40 w-full items-center justify-center">
              <TooltipProvider>
                <Tooltip defaultOpen>
                  <TooltipTrigger render={<Button variant="outline" color="neutral" size="sm" />}>
                    A wider trigger
                  </TooltipTrigger>
                  <TooltipContent side={side} align={align}>
                    <div className="flex flex-col">
                      <span>Tooltip</span>
                      <span>content</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              {side} · {align}
            </p>
          </div>
        )),
      )}
    </div>
  ),
};
