import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "@storybook/test";
import { FolderIcon, SettingsIcon, UserIcon } from "lucide-react";

import { Button } from "../button";
import { Field, FieldGroup, FieldLabel } from "../field";
import { Input } from "../input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../sheet";

const meta: Meta<typeof Sheet> = {
  title: "UI/Sheet",
  component: Sheet,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Sheet>;

export const Default: Story = {
  render: () => (
    <div className="flex items-start justify-center p-6 min-h-[420px]">
      <Sheet>
        <SheetTrigger render={<Button variant="outline" color="neutral" />}>
          Open sheet
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Run settings</SheetTitle>
            <SheetDescription>Configure the branch and label used for this run.</SheetDescription>
          </SheetHeader>
          <FieldGroup className="px-4">
            <Field>
              <FieldLabel htmlFor="sheet-branch">Branch</FieldLabel>
              <Input id="sheet-branch" placeholder="feature/my-branch" />
            </Field>
            <Field>
              <FieldLabel htmlFor="sheet-label">Label</FieldLabel>
              <Input id="sheet-label" placeholder="Nightly run" />
            </Field>
          </FieldGroup>
          <SheetFooter>
            <Button>Save</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open sheet" }));
  },
};

const NAV_ITEMS = [
  { icon: UserIcon, label: "profile" },
  { icon: SettingsIcon, label: "general" },
  { icon: FolderIcon, label: "projects" },
];

export const Navigation: Story = {
  render: () => (
    <div className="flex items-start justify-center p-6 min-h-[420px]">
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" color="neutral" size="icon-sm" />}>
          <FolderIcon />
          <span className="sr-only">Open navigation</span>
        </SheetTrigger>
        <SheetContent side="left" className="gap-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div>
            <div className="flex items-center px-3 pt-3.5 pb-1.5">
              <h2 className="text-badge font-semibold tracking-label uppercase text-ovr-fg-tertiary">
                personal
              </h2>
            </div>
            {NAV_ITEMS.map(({ icon: ItemIcon, label }) => (
              <button
                key={label}
                type="button"
                className="flex w-full items-center gap-2 h-7 pl-2.5 pr-3 text-body-sm text-ovr-fg-secondary border-l-2 border-l-transparent hover:bg-ovr-hover hover:text-ovr-fg"
              >
                <ItemIcon className="size-3 shrink-0 text-ovr-fg-tertiary" />
                <span className="flex-1 truncate text-left">{label}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open navigation" }));
  },
};
