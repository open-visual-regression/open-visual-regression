import { Suspense } from "react";

import { ProjectsSidebarSkeleton } from "@/lib/components/sidebar/ProjectsSidebarSkeleton";
import ProjectsSidebarSlot from "@/lib/components/sidebar/ProjectsSidebarSlot";

export default function SidebarDefault() {
  return (
    <Suspense fallback={<ProjectsSidebarSkeleton />}>
      <ProjectsSidebarSlot />
    </Suspense>
  );
}
