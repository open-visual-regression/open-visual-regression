"use client";

import { useRouter } from "next/navigation";

import { Dialog, DialogContent } from "@ovr/ui/components/dialog";

import { CreateApiKeyModalForm } from "./CreateApiKeyModalForm";

type CreateApiKeyModalProps = {
  projectId: string;
  children: React.ReactNode;
};

export const CreateApiKeyModal = ({ projectId, children }: CreateApiKeyModalProps) => {
  const router = useRouter();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.refresh();
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      {children}
      <DialogContent>
        <CreateApiKeyModalForm projectId={projectId} />
      </DialogContent>
    </Dialog>
  );
};
