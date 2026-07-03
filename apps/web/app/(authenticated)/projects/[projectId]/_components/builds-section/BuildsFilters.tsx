"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  type BuildStatus,
  type ResolutionFilter,
  type ViewportSchema,
} from "@ovr/api/contracts/builds";

import { FacetMenuButton, type FacetMenuItem } from "@/lib/components/Facet/FacetMenuButton";
import { FacetOptionsList } from "@/lib/components/Facet/FacetOptionsList";

import { BROWSER_OPTIONS, BuildsBrowserFacet } from "./BuildsBrowserFacet";
import { BuildsResolutionFacet, toResolutionKey, toResolutionLabel } from "./BuildsResolutionFacet";
import { BuildsStatusFacet, STATUS_OPTIONS } from "./BuildsStatusFacet";

type Browser = ViewportSchema["browser"];

type BuildsFiltersProps = {
  status: BuildStatus[];
  browser: Browser[];
  resolution: string[];
  resolutionOptions: ResolutionFilter[];
  className?: string;
};

export const BuildsFilters = ({
  status,
  browser,
  resolution,
  resolutionOptions,
  className,
}: BuildsFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const commit = (key: "status" | "browser" | "resolution", values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    values.forEach((value) => params.append(key, value));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const applyStatus = (next: BuildStatus[]) => commit("status", next);
  const applyBrowser = (next: Browser[]) => commit("browser", next);
  const applyResolution = (next: string[]) => commit("resolution", next);

  const resolutionOptionList = resolutionOptions.map((option) => ({
    value: toResolutionKey(option),
    label: toResolutionLabel(option),
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
            applyStatus(next as BuildStatus[]);
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
            applyBrowser(next as Browser[]);
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
      key: "resolution",
      label: "resolution",
      active: resolution.length > 0,
      content: (close) => (
        <FacetOptionsList
          options={resolutionOptionList}
          selected={resolution}
          searchable={resolutionOptionList.length > 6}
          onApply={(next) => {
            applyResolution(next);
            close();
          }}
          onClear={() => {
            applyResolution([]);
            close();
          }}
        />
      ),
    },
  ];

  return (
    <div className={className}>
      <div className="hidden items-center gap-2 sm:flex">
        <BuildsStatusFacet selected={status} onApply={applyStatus} />
        <BuildsBrowserFacet selected={browser} onApply={applyBrowser} />
        <BuildsResolutionFacet
          resolutions={resolutionOptions}
          selected={resolution}
          onApply={applyResolution}
        />
      </div>
      <div className="sm:hidden">
        <FacetMenuButton facets={facets} />
      </div>
    </div>
  );
};
