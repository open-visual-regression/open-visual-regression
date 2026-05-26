import { os } from "@orpc/server";
import { getUserCount } from "@ovr/services";

export const setupRouter = {
  getUserCount: os.handler(async () => {
    const count = await getUserCount();
    return { count };
  }),
};
