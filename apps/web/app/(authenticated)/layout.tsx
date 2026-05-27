import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

type AppLayoutProps = Readonly<{
  navigation: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}>;

export default async function AppLayout({ navigation, sidebar, children }: AppLayoutProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen flex-col">
      <Suspense>{navigation}</Suspense>
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden shrink-0 md:block">
          <Suspense>{sidebar}</Suspense>
        </div>
        <main className="flex-1 overflow-auto">
          <Suspense>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
