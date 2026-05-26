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
      <div className="shrink-0 h-[--topbar-h]">{navigation}</div>
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden shrink-0 md:block md:w-12 lg:w-[--sidebar-w]">{sidebar}</div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
