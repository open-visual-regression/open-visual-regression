import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { NavigationBar } from "@/lib/components/navigation-bar/NavigationBar";
import { NavigationBarLogo } from "@/lib/components/navigation-bar/NavigationBarLogo";
import { NavigationBarBreadcrumb } from "@/lib/components/navigation-bar/NavigationBarBreadcrumb";
import { NavigationBarActions } from "@/lib/components/navigation-bar/NavigationBarActions";
import { getBreadcrumbSegments } from "@/lib/components/navigation-bar/getBreadcrumbSegments";
import { NavigationBarMobileMenu } from "@/lib/components/navigation-bar/NavigationBarMobileMenu";
import { Separator } from "@ovr/ui/components/separator";

type NavigationSlotProps = PageProps<"/[[...pathname]]">;

const NAVIGATION_PROJECTS_LIMIT = 10;

export default async function NavigationSlot({ params }: NavigationSlotProps) {
  const { pathname } = await params;

  const [session, segments] = await Promise.all([
    auth.api.getSession({ headers: await headers() }).catch(() => null),
    getBreadcrumbSegments(pathname ?? []),
  ]);

  const userName = session?.user?.name ?? session?.user?.email ?? "";

  const [[listError, listResult], [countError, countResult]] = await Promise.all([
    serverClient.projects.list({ limit: NAVIGATION_PROJECTS_LIMIT }),
    serverClient.projects.count(),
  ]);
  const projects = listError ? [] : listResult.projects;
  const projectsTotal = countError ? 0 : countResult.total;

  return (
    <NavigationBar className="flex flex-row gap-3 justify-between items-center">
      <div className="flex flex-row gap-3 items-center min-w-0">
        <NavigationBarMobileMenu
          role={session?.user?.role}
          projects={projects}
          projectsTotal={projectsTotal}
        />
        <NavigationBarLogo />
        <Separator orientation="vertical" className="h-5" />
        <NavigationBarBreadcrumb segments={segments} />
      </div>
      <NavigationBarActions userName={userName} />
    </NavigationBar>
  );
}
