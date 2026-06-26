import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { XIcon } from "lucide-react";

const Sheet = ({ ...props }: SheetPrimitive.Root.Props) => (
  <SheetPrimitive.Root data-slot="sheet" {...props} />
);

const SheetTrigger = ({ ...props }: SheetPrimitive.Trigger.Props) => (
  <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
);

const SheetClose = ({ ...props }: SheetPrimitive.Close.Props) => (
  <SheetPrimitive.Close data-slot="sheet-close" {...props} />
);

const SheetPortal = ({ ...props }: SheetPrimitive.Portal.Props) => (
  <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
);

const SheetOverlay = ({ className, ...props }: SheetPrimitive.Backdrop.Props) => (
  <SheetPrimitive.Backdrop
    data-slot="sheet-overlay"
    className={cn(
      "fixed inset-0 isolate z-50 bg-black/55 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
      className,
    )}
    {...props}
  />
);

const sheetSideClassNames: Record<"top" | "right" | "bottom" | "left", string> = {
  top: "inset-x-0 top-0 data-open:slide-in-from-top data-closed:slide-out-to-top",
  right:
    "inset-y-0 right-0 h-full w-full sm:max-w-sm data-open:slide-in-from-right data-closed:slide-out-to-right",
  bottom: "inset-x-0 bottom-0 data-open:slide-in-from-bottom data-closed:slide-out-to-bottom",
  left: "inset-y-0 left-0 h-full w-full sm:max-w-sm data-open:slide-in-from-left data-closed:slide-out-to-left",
};

const SheetContent = ({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
}) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Popup
      data-slot="sheet-content"
      data-side={side}
      className={cn(
        "fixed z-50 flex flex-col gap-4 bg-ovr-elevated text-xs/relaxed text-ovr-fg shadow-ovr-modal duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        sheetSideClassNames[side],
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <SheetPrimitive.Close
          data-slot="sheet-close"
          render={
            <Button
              variant="ghost"
              color="neutral"
              className="absolute top-2 right-2"
              size="icon-sm"
            />
          }
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      )}
    </SheetPrimitive.Popup>
  </SheetPortal>
);

const SheetHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div data-slot="sheet-header" className={cn("flex flex-col gap-1 p-4", className)} {...props} />
);

const SheetFooter = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="sheet-footer"
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
);

const SheetTitle = ({ className, ...props }: SheetPrimitive.Title.Props) => (
  <SheetPrimitive.Title
    data-slot="sheet-title"
    className={cn("font-heading text-sm font-semibold", className)}
    {...props}
  />
);

const SheetDescription = ({ className, ...props }: SheetPrimitive.Description.Props) => (
  <SheetPrimitive.Description
    data-slot="sheet-description"
    className={cn("text-xs/relaxed text-ovr-fg-secondary", className)}
    {...props}
  />
);

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
