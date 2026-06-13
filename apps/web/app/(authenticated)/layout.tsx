import { requireSession } from "@/lib/auth/session";
import { DevTools } from "./_components/DevTools";

type AppLayoutProps = Readonly<{
  navigation: React.ReactNode;
  children: React.ReactNode;
}>;

export default async function AppLayout({ navigation, children }: AppLayoutProps) {
  await requireSession();

  return (
    <div className="flex h-screen flex-col">
      {navigation}
      <div className="flex flex-1 overflow-hidden">{children}</div>
      <DevTools />
    </div>
  );
}
