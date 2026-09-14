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
    <div className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] items-center gap-x-4 p-8">
      <div />
      {ALIGNMENTS.map((align) => (
        <p key={align} className="text-center font-mono text-[11px] text-muted-foreground">
          align=&quot;{align}&quot;
        </p>
      ))}
      {SIDES.map((side) => (
        <Fragment key={side}>
          <p className="pr-2 text-right font-mono text-[11px] text-muted-foreground">
            side=&quot;{side}&quot;
          </p>
          {ALIGNMENTS.map((align) => (
            <div key={align} className="flex h-32 items-center justify-center">
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
          ))}
        </Fragment>
      ))}
    </div>
  ),
};
