import { requireSession } from "@/lib/auth/session";
import { SettingsSidebar } from "./_components/settings-sidebar/SettingsSidebar";

type SettingsLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const { user } = await requireSession();

  return (
    <>
      <SettingsSidebar role={user.role} version={process.env.npm_package_version} />
      <div className="flex-1 overflow-auto py-3 px-5 md:py-4 md:px-6 lg:py-6 lg:px-10">
        {children}
      </div>
    </>
  );
}
