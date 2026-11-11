import { Suspense } from "react";

import { APP_VERSION } from "@/lib/utils/version";

import { SettingsSidebar } from "./_components/settings-sidebar/SettingsSidebar";
import { SettingsSidebarContainer } from "./_components/settings-sidebar/SettingsSidebarContainer";

type SettingsLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <>
      <div className="hidden shrink-0 md:block">
        <Suspense fallback={<SettingsSidebar role={null} version={APP_VERSION} />}>
          <SettingsSidebarContainer version={APP_VERSION} />
        </Suspense>
      </div>
      <div className="flex-1 overflow-auto py-3 px-5 md:py-4 md:px-6 lg:py-6 lg:px-10">
        {children}
      </div>
    </>
  );
}
