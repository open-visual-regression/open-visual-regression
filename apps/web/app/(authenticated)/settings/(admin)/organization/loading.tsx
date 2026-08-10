import { TypographySkeleton } from "@ovr/ui/components/typography";

import { UpdateOrganizationFormSkeleton } from "./_components/update-organization-form/UpdateOrganizationForm";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <TypographySkeleton variant="h1" className="w-40" />
      <div className="flex w-full flex-col gap-6 md:w-2/3 lg:w-1/2">
        <UpdateOrganizationFormSkeleton />
      </div>
    </div>
  );
}
