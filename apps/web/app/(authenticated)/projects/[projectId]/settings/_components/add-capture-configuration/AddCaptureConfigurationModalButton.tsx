import { DialogTrigger } from "@ovr/ui/components/dialog";
import { Button } from "@ovr/ui/components/button";

type AddCaptureConfigurationModalButtonProps = {
  children: React.ReactNode;
} & Pick<React.ComponentProps<typeof Button>, "variant" | "size">;

export const AddCaptureConfigurationModalButton = ({
  children,
  variant = "secondary",
  size,
}: AddCaptureConfigurationModalButtonProps) => (
  <DialogTrigger render={<Button variant={variant} size={size} />}>{children}</DialogTrigger>
);
