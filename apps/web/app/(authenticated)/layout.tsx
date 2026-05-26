import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSessionCookie } from "better-auth/cookies";

type AppLayoutProps = Readonly<{
  navigation: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}>;

export default async function AppLayout({ navigation, sidebar, children }: AppLayoutProps) {
  const sessionCookie = getSessionCookie(await headers());

  if (!sessionCookie) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen flex-col">
      {navigation}
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden shrink-0 md:block md:w-12 lg:w-60">{sidebar}</div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
