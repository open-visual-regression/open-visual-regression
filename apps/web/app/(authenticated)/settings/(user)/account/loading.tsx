import { AccountPageShell } from "./_components/AccountPageShell";
import { UpdateAccountFormSkeleton } from "./_components/update-account-form/UpdateAccountForm";
import { UpdatePasswordFormSkeleton } from "./_components/update-password-form/UpdatePasswordForm";

export default function Loading() {
  return (
    <AccountPageShell>
      <UpdateAccountFormSkeleton />
      <UpdatePasswordFormSkeleton />
    </AccountPageShell>
  );
}
