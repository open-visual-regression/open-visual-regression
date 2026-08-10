import { TypographySkeleton } from "@ovr/ui/components/typography";

import { UpdateOrganizationFormSkeleton } from "./_components/update-organization-form/UpdateOrganizationForm";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <TypographySkeleton variant="h1" className="w-40" />
      <UpdateOrganizationFormSkeleton />
    </div>
  );
}
