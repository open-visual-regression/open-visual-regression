import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { NavigationBar } from "@/lib/components/navigation-bar/NavigationBar";
import { NavigationBarLogo } from "@/lib/components/navigation-bar/NavigationBarLogo";
import { NavigationBarSeparator } from "@/lib/components/navigation-bar/NavigationBarSeparator";
import { NavigationBarBreadcrumb } from "@/lib/components/navigation-bar/NavigationBarBreadcrumb";
import { NavigationBarSearch } from "@/lib/components/navigation-bar/NavigationBarSearch";
import { NavigationBarActions } from "@/lib/components/navigation-bar/NavigationBarActions";

export default async function NavigationPage() {
  let userName = "user";

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    userName = session?.user?.name ?? session?.user?.email ?? "user";
  } catch {
    // Render nav in degraded state rather than crashing the slot
  }

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
