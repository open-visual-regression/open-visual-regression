import { Suspense } from "react";

import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ScrollRestoration } from "@/lib/providers/ScrollRestoration";

import { DevTools } from "./_components/DevTools";
import { SessionGuard } from "./_components/SessionGuard";

type AppLayoutProps = Readonly<{
  navigation: React.ReactNode;
  children: React.ReactNode;
}>;

export default function AppLayout({ navigation, children }: AppLayoutProps) {
  return (
    <QueryProvider>
      <Suspense fallback={null}>
        <SessionGuard />
      </Suspense>
      <Suspense fallback={null}>
        <ScrollRestoration />
      </Suspense>
      <div className="flex h-screen flex-col">
        {navigation}
        <div className="flex flex-1 overflow-hidden">{children}</div>
        <DevTools />
      </div>
    </QueryProvider>
  );
}
