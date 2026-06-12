import { DialogTrigger } from "@ovr/ui/components/dialog";
import { Button } from "@ovr/ui/components/button";

type CreateApiKeyModalButtonProps = {
  children: React.ReactNode;
} & Pick<React.ComponentProps<typeof Button>, "variant" | "size">;

export const CreateApiKeyModalButton = ({
  children,
  variant = "secondary",
  size,
}: CreateApiKeyModalButtonProps) => (
  <DialogTrigger render={<Button variant={variant} size={size} />}>{children}</DialogTrigger>
);
