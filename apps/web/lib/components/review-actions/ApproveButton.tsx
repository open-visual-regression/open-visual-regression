"use client";

import { Button } from "@ovr/ui/components/button";
import { Icon, type LucideIcon } from "@ovr/ui/components/icon";

export type ApproveButtonProps = {
  approved: boolean;
  pending: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
  pendingLabel?: string;
  approvedLabel?: string;
  icon?: LucideIcon;
};

export const ApproveButton = ({
  approved,
  pending,
  disabled = false,
  onClick,
  label = "approve",
  pendingLabel = "approving...",
  approvedLabel = "approved",
  icon,
}: ApproveButtonProps) => (
  <Button disabled={pending || approved || disabled} onClick={onClick}>
    {icon ? <Icon icon={icon} /> : null}
    {approved ? approvedLabel : pending ? pendingLabel : label}
  </Button>
);
