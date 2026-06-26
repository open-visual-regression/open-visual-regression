import { DialogTrigger } from "@ovr/ui/components/dialog";
import { Button } from "@ovr/ui/components/button";

type InviteUserModalButtonProps = {
  children: React.ReactNode;
} & Pick<React.ComponentProps<typeof Button>, "variant" | "color" | "size" | "className">;

export const InviteUserModalButton = ({
  children,
  variant = "outline",
  color = "neutral",
  size,
  className,
}: InviteUserModalButtonProps) => (
  <DialogTrigger
    render={<Button variant={variant} color={color} size={size} className={className} />}
  >
    {children}
  </DialogTrigger>
);
