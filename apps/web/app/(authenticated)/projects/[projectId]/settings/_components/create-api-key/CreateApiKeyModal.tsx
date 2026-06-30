"use client";

import { Dialog, DialogContent } from "@ovr/ui/components/dialog";
import { useRouter } from "next/navigation";

import { CreateApiKeyModalForm } from "./CreateApiKeyModalForm";

type CreateApiKeyModalProps = {
  projectId: string;
  trigger: React.ReactNode;
};

export const CreateApiKeyModal = ({ projectId, trigger }: CreateApiKeyModalProps) => {
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
        <CreateApiKeyModalForm projectId={projectId} />
      </DialogContent>
    </Dialog>
  );
};
