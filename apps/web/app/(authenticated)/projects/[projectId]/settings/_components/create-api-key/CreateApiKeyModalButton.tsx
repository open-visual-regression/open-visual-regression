import { DialogTrigger } from "@ovr/ui/components/dialog";
import { Button } from "@ovr/ui/components/button";

type CreateApiKeyModalButtonProps = {
  children: React.ReactNode;
};

export const CreateApiKeyModalButton = ({ children }: CreateApiKeyModalButtonProps) => (
  <DialogTrigger render={<Button variant="secondary" />}>{children}</DialogTrigger>
);
