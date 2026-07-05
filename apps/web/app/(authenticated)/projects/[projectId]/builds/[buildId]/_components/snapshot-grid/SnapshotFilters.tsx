"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { type Browser, type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";

import { FacetMenuButton, type FacetMenuItem } from "@/lib/components/facet/FacetMenuButton";
import { FacetOptionsList, type FacetOption } from "@/lib/components/facet/FacetOptionsList";

import { BROWSER_OPTIONS, SnapshotBrowserFacet } from "./SnapshotBrowserFacet";
import { SnapshotStatusFacet, STATUS_OPTIONS } from "./SnapshotStatusFacet";
import { SnapshotViewportFacet } from "./SnapshotViewportFacet";

type SnapshotFiltersProps = {
  statuses: SnapshotDisplayStatus[];
  browsers: Browser[];
  viewports: string[];
  viewportOptions: FacetOption<string>[];
  className?: string;
};

export const SnapshotFilters = ({
  statuses,
  browsers,
  viewports,
  viewportOptions,
  className,
}: SnapshotFiltersProps) => {
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

  const applyStatuses = (next: SnapshotDisplayStatus[]) => commit("status", next);
  const applyBrowsers = (next: Browser[]) => commit("browser", next);
  const applyViewports = (next: string[]) => commit("viewport", next);

  const facets: FacetMenuItem[] = [
    {
      key: "status",
      label: "status",
      active: statuses.length > 0,
      content: (close) => (
        <FacetOptionsList
          options={STATUS_OPTIONS}
          selected={statuses}
          onApply={(next) => {
            applyStatuses(next);
            close();
          }}
          onClear={() => {
            applyStatuses([]);
            close();
          }}
        />
      ),
    },
    {
      key: "browser",
      label: "browser",
      active: browsers.length > 0,
      content: (close) => (
        <FacetOptionsList
          options={BROWSER_OPTIONS}
          selected={browsers}
          onApply={(next) => {
            applyBrowsers(next);
            close();
          }}
          onClear={() => {
            applyBrowsers([]);
            close();
          }}
        />
      ),
    },
    {
      key: "viewport",
      label: "viewport",
      active: viewports.length > 0,
      content: (close) => (
        <FacetOptionsList
          options={viewportOptions}
          selected={viewports}
          onApply={(next) => {
            applyViewports(next);
            close();
          }}
          onClear={() => {
            applyViewports([]);
            close();
          }}
        />
      ),
    },
  ];

  return (
    <div className={className}>
      <div className="hidden items-center gap-2 lg:flex">
        <SnapshotStatusFacet selected={statuses} onApply={applyStatuses} />
        <SnapshotBrowserFacet selected={browsers} onApply={applyBrowsers} />
        <SnapshotViewportFacet
          options={viewportOptions}
          selected={viewports}
          onApply={applyViewports}
        />
      </div>
      <div className="lg:hidden">
        <FacetMenuButton facets={facets} />
      </div>
    </div>
  );
};
