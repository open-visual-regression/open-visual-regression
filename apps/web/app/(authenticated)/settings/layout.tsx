import { Suspense } from "react";

import { requireSession } from "@/lib/auth/session";
import { Sidebar } from "@/lib/components/sidebar/Sidebar";
import { APP_VERSION } from "@/lib/utils/version";

import { SettingsSidebar } from "./_components/settings-sidebar/SettingsSidebar";

type SettingsLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

const SettingsSidebarSlot = async () => {
  const { user } = await requireSession();

  return <SettingsSidebar role={user.role} version={APP_VERSION} />;
};

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <>
      <div className="hidden shrink-0 md:block">
        <Suspense fallback={<Sidebar version={APP_VERSION} />}>
          <SettingsSidebarSlot />
        </Suspense>
      </div>
      <div className="flex-1 overflow-auto py-3 px-5 md:py-4 md:px-6 lg:py-6 lg:px-10">
        {children}
      </div>
    </>
  );
}
