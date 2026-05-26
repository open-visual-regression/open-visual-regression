import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { NavigationBar } from "@/lib/components/navigation-bar/NavigationBar";
import { NavigationBarLogo } from "@/lib/components/navigation-bar/NavigationBarLogo";
import { NavigationBarSeparator } from "@/lib/components/navigation-bar/NavigationBarSeparator";
import { NavigationBarBreadcrumb } from "@/lib/components/navigation-bar/NavigationBarBreadcrumb";
import { NavigationBarSearch } from "@/lib/components/navigation-bar/NavigationBarSearch";
import { NavigationBarActions } from "@/lib/components/navigation-bar/NavigationBarActions";

export default async function NavigationPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userName = session?.user?.name ?? session?.user?.email ?? "user";

  return (
    <NavigationBar>
      <NavigationBarLogo />
      <NavigationBarSeparator />
      <NavigationBarBreadcrumb />
      <NavigationBarSearch />
      <NavigationBarActions userName={userName} />
    </NavigationBar>
  );
}
