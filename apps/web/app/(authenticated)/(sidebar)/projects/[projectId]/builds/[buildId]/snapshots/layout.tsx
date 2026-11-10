import { cookies } from "next/headers";

import { SnapshotPreferencesProvider } from "./_components/snapshot-preferences/snapshot-preferences";
import { getSnapshotPreferences } from "./_components/snapshot-preferences/snapshotPreferencesCookie";

type SnapshotsLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

// Sits above [snapshotId] so the preferences stay mounted while stepping between snapshots.
export default async function SnapshotsLayout({ children }: SnapshotsLayoutProps) {
  const initialPreferences = getSnapshotPreferences(await cookies());

  return (
    <SnapshotPreferencesProvider initialPreferences={initialPreferences}>
      {children}
    </SnapshotPreferencesProvider>
  );
}
