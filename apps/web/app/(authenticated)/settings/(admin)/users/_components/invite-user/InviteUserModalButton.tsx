import { DialogTrigger } from "@ovr/ui/components/dialog";
import { Button } from "@ovr/ui/components/button";

type InviteUserModalButtonProps = {
  children: React.ReactNode;
} & Pick<React.ComponentProps<typeof Button>, "variant" | "size" | "className">;

export const InviteUserModalButton = ({
  children,
  variant = "secondary",
  size,
  className,
}: InviteUserModalButtonProps) => (
  <DialogTrigger render={<Button variant={variant} size={size} className={className} />}>
    {children}
  </DialogTrigger>
);
