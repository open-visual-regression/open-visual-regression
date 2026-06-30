import { ComponentProps } from "react";

import { cn } from "@ovr/ui/lib/utils";

export const DescriptionList = ({ className, ...props }: ComponentProps<"dl">) => (
  <dl className={cn("flex flex-row gap-6 items-center", className)} {...props} />
);

export const DescriptionListItem = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("flex flex-row gap-2 items-center", className)} {...props} />
);

export const DescriptionTerm = (props: ComponentProps<"dt">) => <dt {...props} />;

export const DescriptionDetails = ({ className, ...props }: ComponentProps<"dd">) => (
  <dd className={cn("flex flex-row gap-1 items-center", className)} {...props} />
);
