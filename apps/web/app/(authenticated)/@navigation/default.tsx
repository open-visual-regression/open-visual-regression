import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { NavigationBar } from "@/lib/components/navigation-bar/NavigationBar";
import { NavigationBarLogo } from "@/lib/components/navigation-bar/NavigationBarLogo";
import { NavigationBarBreadcrumb } from "@/lib/components/navigation-bar/NavigationBarBreadcrumb";
import { NavigationBarActions } from "@/lib/components/navigation-bar/NavigationBarActions";
import { Separator } from "@ovr/ui/components/separator";

export default async function NavigationPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const userName = session?.user?.name ?? session?.user?.email ?? "";

  return (
    <NavigationBar className="flex flex-row gap-3 justify-between items-center">
      <div className="flex flex-row gap-3 items-center">
        <NavigationBarLogo />
        <Separator orientation="vertical" className="h-5" />
        <NavigationBarBreadcrumb />
      </div>
      <NavigationBarActions userName={userName} />
    </NavigationBar>
  );
}
