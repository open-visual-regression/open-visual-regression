import { Separator } from "@ovr/ui/components/separator";

import { requireSession } from "@/lib/auth/session";
import { NavigationBar } from "@/lib/components/navigation-bar/NavigationBar";
import { NavigationBarActions } from "@/lib/components/navigation-bar/NavigationBarActions";
import { NavigationBarLogo } from "@/lib/components/navigation-bar/NavigationBarLogo";
import { NavigationBarMobileMenu } from "@/lib/components/navigation-bar/NavigationBarMobileMenu";
import { getSidebarData } from "@/lib/components/sidebar/getSidebarData";

type AppNavigationBarProps = {
  breadcrumb: React.ReactNode;
};

export const AppNavigationBar = async ({ breadcrumb }: AppNavigationBarProps) => {
  const { user } = await requireSession();
  const { projects, total, builds } = await getSidebarData();

  return (
    <NavigationBar className="flex flex-row items-center justify-between gap-3">
      <div className="flex min-w-0 flex-row items-center gap-3">
        <NavigationBarMobileMenu
          role={user.role}
          projects={projects}
          projectsTotal={total}
          builds={builds}
        />
        <NavigationBarLogo />
        <Separator orientation="vertical" className="h-5" />
        {breadcrumb}
      </div>
      <NavigationBarActions userName={user.name || user.email} />
    </NavigationBar>
  );
};
