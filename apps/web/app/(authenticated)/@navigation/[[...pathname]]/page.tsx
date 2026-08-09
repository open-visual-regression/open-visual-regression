import { getCachedSession } from "@/lib/auth/session";
import { getBreadcrumbSegments } from "@/lib/components/navigation-bar/getBreadcrumbSegments";
import { NavigationBarContent } from "@/lib/components/navigation-bar/NavigationBarContent";
import { serverClient } from "@/lib/router";

type NavigationSlotProps = PageProps<"/[[...pathname]]">;

const NAVIGATION_PROJECTS_LIMIT = 10;
const NAVIGATION_RECENT_BUILDS_LIMIT = 15;

export default async function NavigationSlot({ params }: NavigationSlotProps) {
  const { pathname } = await params;

  const [session, segments] = await Promise.all([
    getCachedSession().catch(() => null),
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
    <NavigationBarContent
      role={session?.user?.role}
      projects={projects}
      projectsTotal={projectsTotal}
      builds={builds}
      segments={segments}
      userName={userName}
    />
  );
}
