import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { NavigationBar } from "@/lib/components/navigation-bar/NavigationBar";
import { NavigationBarLogo } from "@/lib/components/navigation-bar/NavigationBarLogo";
import { NavigationBarBreadcrumb } from "@/lib/components/navigation-bar/NavigationBarBreadcrumb";
import { NavigationBarActions } from "@/lib/components/navigation-bar/NavigationBarActions";
import { NavigationBarMobileMenu } from "@/lib/components/navigation-bar/NavigationBarMobileMenu";
import { Separator } from "@ovr/ui/components/separator";

export default async function NavigationPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const userName = session?.user?.name ?? session?.user?.email ?? "";

  const [projectsError, projectsResult] = await serverClient.projects.list();
  const projects = projectsError ? [] : projectsResult.projects;

  return (
    <NavigationBar className="flex flex-row gap-3 justify-between items-center">
      <div className="flex flex-row gap-3 items-center">
        <NavigationBarMobileMenu role={session?.user?.role} projects={projects} />
        <NavigationBarLogo />
        <Separator orientation="vertical" className="h-5" />
        <NavigationBarBreadcrumb />
      </div>
      <NavigationBarActions userName={userName} />
    </NavigationBar>
  );
}
