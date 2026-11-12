import { Suspense } from "react";

import { getViewerRole } from "@/lib/auth/session";
import { NavigationBarSkeleton } from "@/lib/components/navigation-bar/NavigationBarSkeleton";
import { getSnapshotPreferences } from "@/lib/preferences/getSnapshotPreferences";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ScrollRestoration } from "@/lib/providers/ScrollRestoration";
import { SnapshotPreferencesProvider } from "@/lib/providers/SnapshotPreferencesProvider";
import { ViewerRoleProvider } from "@/lib/providers/ViewerRoleProvider";

import { DevTools } from "./_components/DevTools";
import { NavigationBarContainer } from "./_components/navigation-bar-container/NavigationBarContainer";
import { SessionGuard } from "./_components/SessionGuard";

type AppLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <QueryProvider>
      {/* Not awaited, so reading the preference cookies doesn't hold up the page shell. */}
      <SnapshotPreferencesProvider initialPreferences={getSnapshotPreferences()}>
        <ViewerRoleProvider role={getViewerRole()}>
          <Suspense fallback={null}>
            <SessionGuard />
          </Suspense>
          <Suspense fallback={null}>
            <ScrollRestoration />
          </Suspense>
          <div className="flex h-screen flex-col">
            <Suspense fallback={<NavigationBarSkeleton />}>
              <NavigationBarContainer />
            </Suspense>
            <div className="flex flex-1 overflow-hidden">{children}</div>
            <DevTools />
          </div>
        </ViewerRoleProvider>
      </SnapshotPreferencesProvider>
    </QueryProvider>
  );
}
