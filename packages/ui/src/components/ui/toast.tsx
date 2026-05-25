"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";

import { cn } from "../../lib/utils";

const toastVariants = cva(
  "group/toast relative flex items-stretch overflow-hidden rounded-lg border border-l-3 shadow-ovr-popover w-85",
  {
    variants: {
      variant: {
        default: "border-ovr-status-pending bg-ovr-raised text-ovr-status-pending",
        success: "border-ovr-diff-add  bg-ovr-raised text-ovr-diff-add",
        warning: "border-ovr-accent    bg-ovr-raised text-ovr-accent",
        destructive: "border-ovr-remove    bg-ovr-raised text-ovr-remove",
        muted: "border-ovr-fg-secondary bg-ovr-raised text-ovr-fg-secondary",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

const Toast = ({
  className,
  variant,
  icon,
  title,
  description,
  actionLabel,
  onAction,
  onDismiss,
  ...props
}: ToastProps) => {
  return (
    <div
      data-slot="toast"
      role="status"
      aria-live="polite"
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <div className="flex flex-1 items-start gap-2.5 px-3 py-2.5 min-w-0">
        {icon && (
          <span className="mt-px flex-shrink-0 text-body leading-none text-current">{icon}</span>
        )}
        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          <p className="text-xs font-semibold text-ovr-fg leading-snug">{title}</p>
          {description && (
            <p className="text-label text-ovr-fg-secondary leading-relaxed">{description}</p>
          )}
        </div>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="h-5.5 flex-shrink-0 self-center rounded-lg border border-current bg-transparent px-2 font-mono text-badge font-semibold uppercase tracking-[0.04em] text-current transition-opacity hover:opacity-80 cursor-pointer"
          >
            {actionLabel}
          </button>
        )}
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="mt-px h-4 w-4 flex-shrink-0 self-start bg-transparent border-none text-ovr-fg-tertiary transition-colors hover:text-ovr-fg cursor-pointer p-0 leading-none"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
    </div>
  );
};

const ToastContainer = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="toast-container"
      className={cn("fixed bottom-4 right-4 z-toast flex flex-col items-end gap-2", className)}
      {...props}
    />
  );
};

export { Toast, ToastContainer, toastVariants };
