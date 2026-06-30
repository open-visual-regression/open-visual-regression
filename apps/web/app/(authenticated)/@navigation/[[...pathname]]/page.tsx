import { Separator } from "@ovr/ui/components/separator";
import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";
import { getBreadcrumbSegments } from "@/lib/components/navigation-bar/getBreadcrumbSegments";
import { NavigationBar } from "@/lib/components/navigation-bar/NavigationBar";
import { NavigationBarActions } from "@/lib/components/navigation-bar/NavigationBarActions";
import { NavigationBarBreadcrumb } from "@/lib/components/navigation-bar/NavigationBarBreadcrumb";
import { NavigationBarLogo } from "@/lib/components/navigation-bar/NavigationBarLogo";
import { NavigationBarMobileMenu } from "@/lib/components/navigation-bar/NavigationBarMobileMenu";
import { serverClient } from "@/lib/router";

type NavigationSlotProps = PageProps<"/[[...pathname]]">;

const NAVIGATION_PROJECTS_LIMIT = 10;
const NAVIGATION_RECENT_BUILDS_LIMIT = 15;

export default async function NavigationSlot({ params }: NavigationSlotProps) {
  const { pathname } = await params;

  const [session, segments] = await Promise.all([
    auth.api.getSession({ headers: await headers() }).catch(() => null),
    getBreadcrumbSegments(pathname ?? []),
  ]);

  const userName = session?.user?.name ?? session?.user?.email ?? "";

  const [[listError, listResult], [countError, countResult], [buildsError, buildsResult]] =
    await Promise.all([
      serverClient.projects.list({ limit: NAVIGATION_PROJECTS_LIMIT }),
      serverClient.projects.count(),
      serverClient.builds.list({ limit: NAVIGATION_RECENT_BUILDS_LIMIT }),
    ]);
  const projects = listError ? [] : listResult.projects;
  const projectsTotal = countError ? 0 : countResult.total;
  const builds = buildsError ? [] : buildsResult.builds;

  return (
    <NavigationBar className="flex flex-row gap-3 justify-between items-center">
      <div className="flex flex-row gap-3 items-center min-w-0">
        <NavigationBarMobileMenu
          role={session?.user?.role}
          projects={projects}
          projectsTotal={projectsTotal}
          builds={builds}
        />
        <NavigationBarLogo />
        <Separator orientation="vertical" className="h-5" />
        <NavigationBarBreadcrumb segments={segments} />
      </div>
      <NavigationBarActions userName={userName} />
    </NavigationBar>
  );
}
