"use client";

import { useState } from "react";

import { viewportSchema, type ViewportSchema } from "@ovr/api/contracts/builds";
import { Popover, PopoverContent } from "@ovr/ui/components/popover";

import { FacetOptionsList } from "@/lib/components/Facet/FacetOptionsList";
import { FacetTrigger } from "@/lib/components/Facet/FacetTrigger";
import { formatFacetValueLabel } from "@/lib/components/Facet/formatFacetValueLabel";

type Browser = ViewportSchema["browser"];

export const BROWSER_LABEL: Record<Browser, string> = {
  chromium: "Chromium",
  firefox: "Firefox",
  webkit: "WebKit",
};

export const BROWSER_OPTIONS = viewportSchema.shape.browser.options.map((browser) => ({
  value: browser,
  label: BROWSER_LABEL[browser],
}));

type BuildsBrowserFacetProps = {
  selected: Browser[];
  onApply: (next: Browser[]) => void;
};

export const BuildsBrowserFacet = ({ selected, onApply }: BuildsBrowserFacetProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FacetTrigger
        label="browser"
        valueLabel={formatFacetValueLabel(selected.map((browser) => BROWSER_LABEL[browser]))}
        active={selected.length > 0}
      />
      <PopoverContent>
        <FacetOptionsList
          options={BROWSER_OPTIONS}
          selected={selected}
          onApply={(next) => {
            onApply(next as Browser[]);
            setOpen(false);
          }}
          onClear={() => {
            onApply([]);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
