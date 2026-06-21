"use client";

import { Button } from "@ovr/ui/components/button";
import { Icon, type LucideIcon } from "@ovr/ui/components/icon";

export type RejectButtonProps = {
  rejected: boolean;
  pending: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
  pendingLabel?: string;
  rejectedLabel?: string;
  icon?: LucideIcon;
};

export const RejectButton = ({
  rejected,
  pending,
  disabled = false,
  onClick,
  label = "reject",
  pendingLabel = "rejecting...",
  rejectedLabel = "rejected",
  icon,
}: RejectButtonProps) => (
  <Button variant="secondary" disabled={pending || rejected || disabled} onClick={onClick}>
    {icon ? <Icon icon={icon} /> : null}
    {rejected ? rejectedLabel : pending ? pendingLabel : label}
  </Button>
);
