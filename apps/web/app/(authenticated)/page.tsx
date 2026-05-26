import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Typography } from "@ovr/ui/components/typography";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return <Typography variant="display">open visual regression</Typography>;
}
