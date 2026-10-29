"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

const Combobox = ComboboxPrimitive.Root;

const ComboboxInput = ({
  className,
  wrapperClassName,
  ...props
}: ComboboxPrimitive.Input.Props & { wrapperClassName?: string }) => (
  <div data-slot="combobox-input-wrapper" className={cn("relative w-full", wrapperClassName)}>
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-ovr-border bg-ovr-elevated py-1 pr-8 pl-2.5 text-xs text-ovr-fg transition-colors outline-none placeholder:text-ovr-fg-muted focus-visible:border-ovr-accent focus-visible:ring-2 focus-visible:ring-ovr-accent-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-ovr-remove aria-invalid:ring-2 aria-invalid:ring-ovr-remove/30",
        className,
      )}
      {...props}
    />
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      aria-label="show options"
      className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground outline-none"
    >
      <ChevronDownIcon className="pointer-events-none size-4" />
    </ComboboxPrimitive.Trigger>
  </div>
);

const ComboboxContent = ({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<ComboboxPrimitive.Positioner.Props, "align" | "side" | "sideOffset">) => (
  <ComboboxPrimitive.Portal>
    <ComboboxPrimitive.Positioner
      side={side}
      sideOffset={sideOffset}
      align={align}
      className="isolate z-50"
    >
      <ComboboxPrimitive.Popup
        data-slot="combobox-content"
        className={cn(
          "relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl bg-ovr-raised p-1 text-ovr-fg shadow-ovr-popover duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      >
        {children}
      </ComboboxPrimitive.Popup>
    </ComboboxPrimitive.Positioner>
  </ComboboxPrimitive.Portal>
);

const ComboboxList = ({ className, ...props }: ComboboxPrimitive.List.Props) => (
  <ComboboxPrimitive.List
    data-slot="combobox-list"
    className={cn("max-h-72 overflow-y-auto empty:hidden", className)}
    {...props}
  />
);

const ComboboxItem = ({ className, children, ...props }: ComboboxPrimitive.Item.Props) => (
  <ComboboxPrimitive.Item
    data-slot="combobox-item"
    className={cn(
      "relative flex w-full cursor-default items-center gap-2 rounded-lg py-1.5 pr-8 pl-2.5 text-xs outline-hidden select-none data-highlighted:bg-ovr-hover data-disabled:pointer-events-none data-disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="flex flex-1 gap-2 truncate">{children}</span>
    <ComboboxPrimitive.ItemIndicator
      render={
        <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
      }
    >
      <CheckIcon className="pointer-events-none size-4" />
    </ComboboxPrimitive.ItemIndicator>
  </ComboboxPrimitive.Item>
);

const ComboboxEmpty = ({ className, ...props }: ComboboxPrimitive.Empty.Props) => (
  <ComboboxPrimitive.Empty
    data-slot="combobox-empty"
    className={cn("px-2.5 py-1.5 text-xs text-muted-foreground empty:hidden", className)}
    {...props}
  />
);

const ComboboxStatus = ({ className, ...props }: ComboboxPrimitive.Status.Props) => (
  <ComboboxPrimitive.Status
    data-slot="combobox-status"
    className={cn("px-2.5 py-1.5 text-xs text-muted-foreground empty:hidden", className)}
    {...props}
  />
);

export {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
};
