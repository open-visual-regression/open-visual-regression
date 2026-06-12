import { Dialog, DialogContent } from "@ovr/ui/components/dialog";
import { CreateApiKeyModalForm } from "./CreateApiKeyModalForm";

type CreateApiKeyModalProps = {
  projectId: string;
  trigger: React.ReactNode;
};

export const CreateApiKeyModal = ({ projectId, trigger }: CreateApiKeyModalProps) => (
  <Dialog>
    {trigger}
    <DialogContent>
      <CreateApiKeyModalForm projectId={projectId} />
    </DialogContent>
  </Dialog>
);
