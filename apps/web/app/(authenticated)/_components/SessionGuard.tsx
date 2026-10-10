import { requireSession } from "@/lib/auth/session";

export const SessionGuard = async () => {
  await requireSession();

  return null;
};
