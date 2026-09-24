import { Button } from "@ovr/ui/components/button";
import { DialogTrigger } from "@ovr/ui/components/dialog";

type CreateApiKeyModalButtonProps = {
  children: React.ReactNode;
} & Pick<React.ComponentProps<typeof Button>, "variant" | "color" | "size">;

export const CreateApiKeyModalButton = ({
  children,
  variant = "outline",
  color = "neutral",
  size,
}: CreateApiKeyModalButtonProps) => (
  <DialogTrigger render={<Button variant={variant} color={color} size={size} />}>
    {children}
  </DialogTrigger>
);
