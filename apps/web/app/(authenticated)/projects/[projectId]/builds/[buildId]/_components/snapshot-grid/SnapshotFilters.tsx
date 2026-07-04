"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { type Browser, type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";

import { FacetMenuButton, type FacetMenuItem } from "@/lib/components/facet/FacetMenuButton";
import { FacetOptionsList } from "@/lib/components/facet/FacetOptionsList";

import { BROWSER_OPTIONS, SnapshotBrowserFacet } from "./SnapshotBrowserFacet";
import { SnapshotStatusFacet, STATUS_OPTIONS } from "./SnapshotStatusFacet";

type SnapshotFiltersProps = {
  statuses: SnapshotDisplayStatus[];
  browsers: Browser[];
  className?: string;
};

export const SnapshotFilters = ({ statuses, browsers, className }: SnapshotFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const commit = (key: "status" | "browser", values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    values.forEach((value) => params.append(key, value));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const applyStatuses = (next: SnapshotDisplayStatus[]) => commit("status", next);
  const applyBrowsers = (next: Browser[]) => commit("browser", next);

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
  ];

  return (
    <div className={className}>
      <div className="hidden items-center gap-2 lg:flex">
        <SnapshotStatusFacet selected={statuses} onApply={applyStatuses} />
        <SnapshotBrowserFacet selected={browsers} onApply={applyBrowsers} />
      </div>
      <div className="lg:hidden">
        <FacetMenuButton facets={facets} />
      </div>
    </div>
  );
};
