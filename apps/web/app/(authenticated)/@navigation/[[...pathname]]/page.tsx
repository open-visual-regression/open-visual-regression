import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { NavigationBar } from "@/lib/components/navigation-bar/NavigationBar";
import { NavigationBarLogo } from "@/lib/components/navigation-bar/NavigationBarLogo";
import { NavigationBarBreadcrumb } from "@/lib/components/navigation-bar/NavigationBarBreadcrumb";
import { NavigationBarActions } from "@/lib/components/navigation-bar/NavigationBarActions";
import { getBreadcrumbSegments } from "@/lib/components/navigation-bar/getBreadcrumbSegments";
import { Separator } from "@ovr/ui/components/separator";

type NavigationSlotProps = {
  params: Promise<{ pathname?: string[] }>;
};

export default async function NavigationSlot({ params }: NavigationSlotProps) {
  const { pathname } = await params;

  const [session, segments] = await Promise.all([
    auth.api.getSession({ headers: await headers() }).catch(() => null),
    getBreadcrumbSegments(pathname ?? []),
  ]);

  const userName = session?.user?.name ?? session?.user?.email ?? "";

  return (
    <NavigationBar className="flex flex-row gap-3 justify-between items-center">
      <div className="flex flex-row gap-3 items-center min-w-0">
        <NavigationBarLogo />
        <Separator orientation="vertical" className="h-5" />
        <NavigationBarBreadcrumb segments={segments} />
      </div>
      <NavigationBarActions userName={userName} />
    </NavigationBar>
  );
}
