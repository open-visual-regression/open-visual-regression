import { fileURLToPath } from "node:url";

import { config } from "dotenv";

config({ path: fileURLToPath(new URL("../.env.development.local", import.meta.url)) });
