import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";

import { cn } from "../../lib/utils";

const Breadcrumb = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav aria-label="breadcrumb" data-slot="breadcrumb" className={cn(className)} {...props} />
);

const BreadcrumbList = ({ className, ...props }: React.ComponentProps<"ol">) => (
  <ol
    data-slot="breadcrumb-list"
    className={cn(
      "flex flex-wrap items-center gap-1.5 text-body-sm text-ovr-fg-tertiary wrap-break-word",
      className,
    )}
    {...props}
  />
);

const BreadcrumbItem = ({ className, ...props }: React.ComponentProps<"li">) => (
  <li
    data-slot="breadcrumb-item"
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
);

const BreadcrumbLink = ({ className, render, ...props }: useRender.ComponentProps<"a">) =>
  useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      { className: cn("transition-colors hover:text-ovr-fg", className) },
      props,
    ),
    render,
    state: { slot: "breadcrumb-link" },
  });

const BreadcrumbPage = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    data-slot="breadcrumb-page"
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-medium text-ovr-fg", className)}
    {...props}
  />
);

const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<"li">) => (
  <li
    data-slot="breadcrumb-separator"
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:size-3", className)}
    {...props}
  >
    {children ?? <ChevronRightIcon />}
  </li>
);

const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    data-slot="breadcrumb-ellipsis"
    role="presentation"
    aria-hidden="true"
    className={cn("flex size-5 items-center justify-center [&>svg]:size-4", className)}
    {...props}
  >
    <MoreHorizontalIcon />
    <span className="sr-only">More</span>
  </span>
);

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
