import type { Meta, StoryObj } from "@storybook/react-vite";
import { Fragment } from "react";

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

const SIDES: TooltipSide[] = ["top", "bottom", "left", "right"];
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
    <div className="grid w-fit grid-cols-[80px_repeat(3,380px)] items-center p-6">
      <div />
      {ALIGNMENTS.map((align) => (
        <p key={align} className="text-center font-mono text-[11px] text-muted-foreground">
          align=&quot;{align}&quot;
        </p>
      ))}
      {SIDES.map((side) => (
        <Fragment key={side}>
          <p className="pr-3 text-right font-mono text-[11px] text-muted-foreground">{side}</p>
          {ALIGNMENTS.map((align) => (
            <div key={align} className="flex h-40 items-center justify-center">
              <TooltipProvider>
                <Tooltip defaultOpen>
                  <TooltipTrigger
                    render={<Button variant="outline" color="neutral" className="h-16 w-24" />}
                  >
                    Trigger
                  </TooltipTrigger>
                  <TooltipContent side={side} align={align}>
                    Tooltip content
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  ),
};
