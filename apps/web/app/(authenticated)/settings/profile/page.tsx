import { Typography } from "@ovr/ui/components/typography";
import { UpdatePasswordForm } from "./_components/update-password-form/UpdatePasswordForm";
import { UpdateProfileForm } from "./_components/update-profile-form/UpdateProfileForm";
import { requireSession } from "@/lib/auth/session";

export default async function SettingsProfilePage() {
  const { user } = await requireSession();

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h1" as="h1">
        profile
      </Typography>
      <div className="flex w-full flex-col gap-6 md:w-2/3 lg:w-1/2">
        <UpdateProfileForm user={{ name: user.name, email: user.email }} />
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
