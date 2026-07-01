import { Typography } from "@ovr/ui/components/typography";

import { requireSession } from "@/lib/auth/session";

import { UpdateAccountForm } from "./_components/update-account-form/UpdateAccountForm";
import { UpdatePasswordForm } from "./_components/update-password-form/UpdatePasswordForm";

export default async function SettingsAccountPage() {
  const { user } = await requireSession();

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h1" as="h1">
        account
      </Typography>
      <div className="flex w-full flex-col gap-6 md:w-2/3 lg:w-1/2">
        <UpdateAccountForm user={{ name: user.name, email: user.email }} />
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
