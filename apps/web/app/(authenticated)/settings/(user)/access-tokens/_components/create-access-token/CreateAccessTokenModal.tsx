"use client";

import { useRouter } from "next/navigation";

import { Dialog, DialogContent } from "@ovr/ui/components/dialog";

import { CreateAccessTokenModalForm } from "./CreateAccessTokenModalForm";

type CreateAccessTokenModalProps = {
  trigger: React.ReactNode;
};

export const CreateAccessTokenModal = ({ trigger }: CreateAccessTokenModalProps) => {
  const router = useRouter();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.refresh();
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      {trigger}
      <DialogContent>
        <CreateAccessTokenModalForm />
      </DialogContent>
    </Dialog>
  );
};
