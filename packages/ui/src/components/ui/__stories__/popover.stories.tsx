import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "@storybook/test";
import { SlidersHorizontalIcon } from "lucide-react";

import { Button } from "../button";
import { Field, FieldGroup, FieldLabel } from "../field";
import { Input } from "../input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";
import { Separator } from "../separator";

const meta: Meta<typeof Popover> = {
  title: "UI/Popover",
  component: Popover,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const FilterRuns: Story = {
  render: () => (
    <div className="flex items-start justify-center p-6 min-h-[460px]">
      <Popover>
        <PopoverTrigger render={<Button variant="secondary" size="sm" />}>
          <SlidersHorizontalIcon />
          Filter
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <PopoverHeader>
            <PopoverTitle>Filter runs</PopoverTitle>
            <PopoverDescription>
              Narrow the run list by branch, status, or threshold.
            </PopoverDescription>
          </PopoverHeader>
          <Separator />
          <FieldGroup>
            <Field>
              <FieldLabel>Branch</FieldLabel>
              <Input placeholder="feature/…" />
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Max diffs</FieldLabel>
              <Input type="number" placeholder="0" />
            </Field>
          </FieldGroup>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm">
              Reset
            </Button>
            <Button size="sm">Apply</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /filter/i }));
  },
};
