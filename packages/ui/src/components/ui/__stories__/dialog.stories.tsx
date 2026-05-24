import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "@storybook/test";

import { Button } from "../button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "../field";
import { Input } from "../input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";

const meta: Meta<typeof Dialog> = {
  title: "UI/Dialog",
  component: Dialog,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => (
    <div className="flex items-start justify-center p-6 min-h-[420px]">
      <Dialog>
        <DialogTrigger render={<Button variant="secondary" />}>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New run</DialogTitle>
            <DialogDescription>
              Configure a new visual regression run against the current baseline.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="dlg-branch">Branch</FieldLabel>
              <Input id="dlg-branch" placeholder="feature/my-branch" />
            </Field>
            <Field>
              <FieldLabel htmlFor="dlg-env">Environment</FieldLabel>
              <FieldDescription>The environment to capture snapshots in.</FieldDescription>
              <Select defaultValue="ci">
                <SelectTrigger id="dlg-env">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ci">CI</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter showCloseButton>
            <Button>Start run</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open dialog" }));
  },
};

export const Simple: Story = {
  render: () => (
    <div className="flex items-start justify-center p-6 min-h-64">
      <Dialog>
        <DialogTrigger render={<Button variant="ghost" />}>Update baseline</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update baseline?</DialogTitle>
            <DialogDescription>
              This will replace the current baseline for all 142 snapshots on <strong>main</strong>.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
            <Button>Update baseline</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Update baseline" }));
  },
};
