import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { NavigationBar } from "@/lib/components/navigation-bar/NavigationBar";
import { NavigationBarLogo } from "@/lib/components/navigation-bar/NavigationBarLogo";
import { NavigationBarBreadcrumb } from "@/lib/components/navigation-bar/NavigationBarBreadcrumb";
import { NavigationBarActions } from "@/lib/components/navigation-bar/NavigationBarActions";
import { Separator } from "@ovr/ui/components/separator";

export default async function NavigationPage() {
  const [session, [, listProjectsResult]] = await Promise.all([
    auth.api.getSession({ headers: await headers() }).catch(() => null),
    serverClient.projects.list(),
  ]);

  const userName = session?.user?.name ?? session?.user?.email ?? "";
  const projects = listProjectsResult?.projects ?? [];

  return (
    <NavigationBar className="flex flex-row gap-3 justify-between items-center">
      <div className="flex flex-row gap-3 items-center min-w-0">
        <NavigationBarLogo />
        <Separator orientation="vertical" className="h-5" />
        <NavigationBarBreadcrumb projects={projects} />
      </div>
      <NavigationBarActions userName={userName} />
    </NavigationBar>
  );
}
