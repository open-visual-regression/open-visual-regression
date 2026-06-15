"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchField } from "@/lib/components/SearchField/SearchField";

type UsersSearchFieldProps = {
  className?: string;
};

export const UsersSearchField = ({ className }: UsersSearchFieldProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    const query = params.toString();

    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  return (
    <SearchField
      className={className}
      label="search users"
      placeholder="search users..."
      defaultValue={searchParams.get("search") ?? ""}
      loading={isPending}
      onSearchAction={handleSearch}
    />
  );
};
