import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { DevTools } from "./_components/DevTools";

type AppLayoutProps = Readonly<{
  navigation: React.ReactNode;
  children: React.ReactNode;
}>;

export default async function AppLayout({ navigation, children }: AppLayoutProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen flex-col">
      {navigation}
      <div className="flex flex-1 overflow-hidden">{children}</div>
      <DevTools />
    </div>
  );
}
