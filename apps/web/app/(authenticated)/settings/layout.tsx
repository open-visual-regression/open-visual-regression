import { requireSession } from "@/lib/auth/session";
import { APP_VERSION } from "@/lib/utils/version";

import { SettingsSidebar } from "./_components/settings-sidebar/SettingsSidebar";

type SettingsLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const { user } = await requireSession();

  return (
    <>
      <div className="hidden shrink-0 md:block">
        <SettingsSidebar role={user.role} version={APP_VERSION} />
      </div>
      <div className="flex-1 overflow-auto py-3 px-5 md:py-4 md:px-6 lg:py-6 lg:px-10">
        {children}
      </div>
    </>
  );
}
