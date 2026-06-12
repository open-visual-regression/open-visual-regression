import { GenericContainer, Wait } from "testcontainers";

const PORT = 9000;
const ACCESS_KEY = "rustfsadmin";
const SECRET_KEY = "rustfsadmin";

export type RustfsContainer = {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  stop: () => Promise<void>;
};

export const startRustfs = async (): Promise<RustfsContainer> => {
  const container = await new GenericContainer("rustfs/rustfs:latest")
    .withExposedPorts(PORT)
    .withEnvironment({
      RUSTFS_ACCESS_KEY: ACCESS_KEY,
      RUSTFS_SECRET_KEY: SECRET_KEY,
      RUSTFS_ADDRESS: `0.0.0.0:${PORT}`,
      RUSTFS_VOLUMES: "/data",
    })
    .withWaitStrategy(Wait.forListeningPorts())
    .withStartupTimeout(120_000)
    .start();

  return {
    endpoint: `http://${container.getHost()}:${container.getMappedPort(PORT)}`,
    accessKey: ACCESS_KEY,
    secretKey: SECRET_KEY,
    stop: async () => {
      await container.stop();
    },
  };
};
