"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@ovr/ui/components/dialog";
import { AddCaptureConfigurationModalForm } from "./AddCaptureConfigurationModalForm";

type AddCaptureConfigurationModalProps = {
  projectId: string;
  trigger: React.ReactNode;
};

export const AddCaptureConfigurationModal = ({
  projectId,
  trigger,
}: AddCaptureConfigurationModalProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent>
        <AddCaptureConfigurationModalForm
          projectId={projectId}
          onAddAction={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
