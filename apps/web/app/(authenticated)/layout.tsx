import { Suspense } from "react";

import { requireSession } from "@/lib/auth/session";
import { NavigationBarSkeleton } from "@/lib/components/navigation-bar/NavigationBarSkeleton";
import { getSnapshotPreferences } from "@/lib/preferences/getSnapshotPreferences";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ScrollRestoration } from "@/lib/providers/ScrollRestoration";
import { SnapshotPreferencesProvider } from "@/lib/providers/SnapshotPreferencesProvider";

import { DevTools } from "./_components/DevTools";
import { NavigationBarContainer } from "./_components/navigation-bar-container/NavigationBarContainer";

type AppLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function AppLayout({ children }: AppLayoutProps) {
  const [, snapshotPreferences] = await Promise.all([requireSession(), getSnapshotPreferences()]);

  return (
    <QueryProvider>
      <SnapshotPreferencesProvider initialPreferences={snapshotPreferences}>
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
      </SnapshotPreferencesProvider>
    </QueryProvider>
  );
}
