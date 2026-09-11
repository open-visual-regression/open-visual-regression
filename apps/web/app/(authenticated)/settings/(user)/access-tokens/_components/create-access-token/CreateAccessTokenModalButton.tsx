import { Button } from "@ovr/ui/components/button";
import { DialogTrigger } from "@ovr/ui/components/dialog";

type CreateAccessTokenModalButtonProps = {
  children: React.ReactNode;
} & Pick<React.ComponentProps<typeof Button>, "variant" | "color" | "size">;

export const CreateAccessTokenModalButton = ({
  children,
  variant = "outline",
  color = "neutral",
  size,
}: CreateAccessTokenModalButtonProps) => (
  <DialogTrigger render={<Button variant={variant} color={color} size={size} />}>
    {children}
  </DialogTrigger>
);
