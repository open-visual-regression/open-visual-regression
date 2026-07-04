"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";

import { FacetMenuButton, type FacetMenuItem } from "@/lib/components/facet/FacetMenuButton";
import { FacetOptionsList } from "@/lib/components/facet/FacetOptionsList";

import { SnapshotStatusFacet, STATUS_OPTIONS } from "./SnapshotStatusFacet";

type SnapshotFiltersProps = {
  statuses: SnapshotDisplayStatus[];
  className?: string;
};

export const SnapshotFilters = ({ statuses, className }: SnapshotFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const commit = (key: "status", values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    values.forEach((value) => params.append(key, value));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const applyStatuses = (next: SnapshotDisplayStatus[]) => commit("status", next);

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
  ];

  return (
    <div className={className}>
      <div className="hidden items-center gap-2 lg:flex">
        <SnapshotStatusFacet selected={statuses} onApply={applyStatuses} />
      </div>
      <div className="lg:hidden">
        <FacetMenuButton facets={facets} />
      </div>
    </div>
  );
};
