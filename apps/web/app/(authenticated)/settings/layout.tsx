import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { SettingsSidebar } from "./_components/settings-sidebar/SettingsSidebar";

type SettingsLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <SettingsSidebar role={session.user.role} version={process.env.npm_package_version} />
      <div className="flex-1 overflow-auto py-3 px-5 md:py-4 md:px-6 lg:py-6 lg:px-10">
        {children}
      </div>
    </>
  );
}
