import { DialogTrigger } from "@ovr/ui/components/dialog";
import { Button } from "@ovr/ui/components/button";

type InviteUserModalButtonProps = {
  children: React.ReactNode;
} & Pick<React.ComponentProps<typeof Button>, "variant" | "size">;

export const InviteUserModalButton = ({
  children,
  variant = "secondary",
  size,
}: InviteUserModalButtonProps) => (
  <DialogTrigger render={<Button variant={variant} size={size} />}>{children}</DialogTrigger>
);
