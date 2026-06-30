"use client";

import { Dialog, DialogContent } from "@ovr/ui/components/dialog";

import { InviteUserModalForm } from "./InviteUserModalForm";

type InviteUserModalProps = {
  trigger: React.ReactNode;
};

export const InviteUserModal = ({ trigger }: InviteUserModalProps) => (
  <Dialog>
    {trigger}
    <DialogContent>
      <InviteUserModalForm />
    </DialogContent>
  </Dialog>
);
