"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  type BuildStatus,
  type ViewportOption,
  type ViewportSchema,
} from "@ovr/api/contracts/builds";

import { FacetMenuButton, type FacetMenuItem } from "@/lib/components/facet/FacetMenuButton";
import { FacetOptionsList } from "@/lib/components/facet/FacetOptionsList";

import { BROWSER_OPTIONS, BuildsBrowserFacet } from "./BuildsBrowserFacet";
import { BuildsStatusFacet, STATUS_OPTIONS } from "./BuildsStatusFacet";
import { BuildsViewportFacet, toViewportKey, toViewportLabel } from "./BuildsViewportFacet";

type Browser = ViewportSchema["browser"];

type BuildsFiltersProps = {
  status: BuildStatus[];
  browser: Browser[];
  viewport: string[];
  viewportOptions: ViewportOption[];
  className?: string;
};

export const BuildsFilters = ({
  status,
  browser,
  viewport,
  viewportOptions,
  className,
}: BuildsFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const commit = (key: "status" | "browser" | "viewport", values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    values.forEach((value) => params.append(key, value));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const applyStatus = (next: BuildStatus[]) => commit("status", next);
  const applyBrowser = (next: Browser[]) => commit("browser", next);
  const applyViewport = (next: string[]) => commit("viewport", next);

  const viewportOptionList = viewportOptions.map((option) => ({
    value: toViewportKey(option),
    label: toViewportLabel(option),
  }));

  const facets: FacetMenuItem[] = [
    {
      key: "status",
      label: "status",
      active: status.length > 0,
      content: (close) => (
        <FacetOptionsList
          options={STATUS_OPTIONS}
          selected={status}
          onApply={(next) => {
            applyStatus(next);
            close();
          }}
          onClear={() => {
            applyStatus([]);
            close();
          }}
        />
      ),
    },
    {
      key: "browser",
      label: "browser",
      active: browser.length > 0,
      content: (close) => (
        <FacetOptionsList
          options={BROWSER_OPTIONS}
          selected={browser}
          onApply={(next) => {
            applyBrowser(next);
            close();
          }}
          onClear={() => {
            applyBrowser([]);
            close();
          }}
        />
      ),
    },
    {
      key: "viewport",
      label: "viewport",
      active: viewport.length > 0,
      content: (close) => (
        <FacetOptionsList
          options={viewportOptionList}
          selected={viewport}
          searchable={viewportOptionList.length > 6}
          onApply={(next) => {
            applyViewport(next);
            close();
          }}
          onClear={() => {
            applyViewport([]);
            close();
          }}
        />
      ),
    },
  ];

  return (
    <div className={className}>
      <div className="hidden items-center gap-2 lg:flex">
        <BuildsStatusFacet selected={status} onApply={applyStatus} />
        <BuildsBrowserFacet selected={browser} onApply={applyBrowser} />
        <BuildsViewportFacet
          viewports={viewportOptions}
          selected={viewport}
          onApply={applyViewport}
        />
      </div>
      <div className="lg:hidden">
        <FacetMenuButton facets={facets} />
      </div>
    </div>
  );
};
