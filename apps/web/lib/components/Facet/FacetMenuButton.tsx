"use client";

import { useState } from "react";

import { Button } from "@ovr/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@ovr/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ovr/ui/components/dropdown-menu";
import { Icon, ListFilterIcon } from "@ovr/ui/components/icon";
import { cn } from "@ovr/ui/lib/utils";

export type FacetMenuItem = {
  key: string;
  label: string;
  active: boolean;
  content: (close: () => void) => React.ReactNode;
};

type FacetMenuButtonProps = {
  facets: FacetMenuItem[];
};

export const FacetMenuButton = ({ facets }: FacetMenuButtonProps) => {
  const [activeFacetKey, setActiveFacetKey] = useState<string | null>(null);
  const hasActiveFacet = facets.some((facet) => facet.active);
  const activeFacet = facets.find((facet) => facet.key === activeFacetKey) ?? null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              color="neutral"
              size="icon"
              aria-label="filters"
              className="relative"
            />
          }
        >
          <Icon icon={ListFilterIcon} />
          {hasActiveFacet ? (
            <span
              aria-hidden
              className="absolute top-1 right-1 size-1.5 rounded-full bg-ovr-accent"
            />
          ) : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {facets.map((facet) => (
            <DropdownMenuItem
              key={facet.key}
              className={cn(facet.active && "bg-ovr-accent-dim text-ovr-accent")}
              onClick={() => setActiveFacetKey(facet.key)}
            >
              {facet.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={activeFacet !== null} onOpenChange={(open) => !open && setActiveFacetKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeFacet?.label}</DialogTitle>
          </DialogHeader>
          {activeFacet?.content(() => setActiveFacetKey(null))}
        </DialogContent>
      </Dialog>
    </>
  );
};
