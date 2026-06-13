import { GenericContainer, Wait } from "testcontainers";

const RUSTFS_PORT = 9000;
const RUSTFS_ACCESS_KEY = "rustfsadmin";
const RUSTFS_SECRET_KEY = "rustfsadmin";

export type RustfsContainer = {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  stop: () => Promise<void>;
};

export const startRustfs = async (): Promise<RustfsContainer> => {
  const container = await new GenericContainer("rustfs/rustfs:latest")
    .withExposedPorts(RUSTFS_PORT)
    .withEnvironment({
      RUSTFS_ACCESS_KEY,
      RUSTFS_SECRET_KEY,
      RUSTFS_ADDRESS: `0.0.0.0:${RUSTFS_PORT}`,
      RUSTFS_VOLUMES: "/data",
    })
    .withWaitStrategy(Wait.forListeningPorts())
    .withStartupTimeout(120_000)
    .start();

  return {
    endpoint: `http://${container.getHost()}:${container.getMappedPort(RUSTFS_PORT)}`,
    accessKey: RUSTFS_ACCESS_KEY,
    secretKey: RUSTFS_SECRET_KEY,
    stop: async () => {
      await container.stop();
    },
  };
};

const VALKEY_PORT = 6379;

export type ValkeyContainer = {
  host: string;
  port: number;
  stop: () => Promise<void>;
};

export const startValkey = async (): Promise<ValkeyContainer> => {
  const container = await new GenericContainer("valkey/valkey:8-alpine")
    .withExposedPorts(VALKEY_PORT)
    .withWaitStrategy(Wait.forListeningPorts())
    .withStartupTimeout(120_000)
    .start();

  return {
    host: container.getHost(),
    port: container.getMappedPort(VALKEY_PORT),
    stop: async () => {
      await container.stop();
    },
  };
};
