import { os } from "@orpc/server";
import { setupService } from "@ovr/services";

export const setupRouter = {
  getSetupStatus: os.handler(async () => {
    const status = await setupService.getSetupStatus();
    return { status };
  }),
};
