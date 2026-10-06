import { usesTrustedProxy } from "@/lib/auth/config";
import { requireSession } from "@/lib/auth/session";

import { AccountPageShell } from "./_components/AccountPageShell";
import { UpdateAccountForm } from "./_components/update-account-form/UpdateAccountForm";
import { UpdatePasswordForm } from "./_components/update-password-form/UpdatePasswordForm";

export default async function SettingsAccountPage() {
  const { user } = await requireSession();
  const trustedProxy = usesTrustedProxy();

  return (
    <AccountPageShell>
      <UpdateAccountForm user={{ name: user.name, email: user.email }} readOnly={trustedProxy} />
      {!trustedProxy && <UpdatePasswordForm />}
    </AccountPageShell>
  );
}
