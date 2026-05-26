import { redirect } from "next/navigation";
import { rpc } from "@/lib/rpc";
import { LogoFull } from "@/lib/components/logo/Logo";
import { Typography } from "@ovr/ui/components/typography";
import { SetupCard } from "./_components/setup-card/SetupCard";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const { count } = await rpc.setup.getUserCount();

  if (count > 0) {
    redirect("/login");
  }

  return (
    <div className="flex-1 flex flex-row justify-center items-center py-6 md:py-12 px-8">
      <div className="w-full max-w-115 flex flex-col items-center gap-6">
        <LogoFull />
        <SetupCard />
        <Typography variant="caption">
          self-hosted · v{process.env.npm_package_version ?? "0.0.0"}
        </Typography>
      </div>
    </div>
  );
}
