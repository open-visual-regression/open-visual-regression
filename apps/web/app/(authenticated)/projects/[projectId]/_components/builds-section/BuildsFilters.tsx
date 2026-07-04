"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { type BuildStatus } from "@ovr/api/contracts/builds";

import { FacetMenuButton, type FacetMenuItem } from "@/lib/components/facet/FacetMenuButton";
import { FacetOptionsList } from "@/lib/components/facet/FacetOptionsList";

import { BuildsStatusFacet, STATUS_OPTIONS } from "./BuildsStatusFacet";

type BuildsFiltersProps = {
  status: BuildStatus[];
  className?: string;
};

export const BuildsFilters = ({ status, className }: BuildsFiltersProps) => {
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

  const applyStatus = (next: BuildStatus[]) => commit("status", next);

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
  ];

  return (
    <div className={className}>
      <div className="hidden items-center gap-2 lg:flex">
        <BuildsStatusFacet selected={status} onApply={applyStatus} />
      </div>
      <div className="lg:hidden">
        <FacetMenuButton facets={facets} />
      </div>
    </div>
  );
};
