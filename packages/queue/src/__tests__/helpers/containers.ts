import { GenericContainer, Wait } from "testcontainers";

const PORT = 6379;

export type ValkeyContainer = {
  host: string;
  port: number;
  stop: () => Promise<void>;
};

export const startValkey = async (): Promise<ValkeyContainer> => {
  const container = await new GenericContainer("valkey/valkey:8-alpine")
    .withExposedPorts(PORT)
    .withWaitStrategy(Wait.forListeningPorts())
    .withStartupTimeout(120_000)
    .start();

  return {
    host: container.getHost(),
    port: container.getMappedPort(PORT),
    stop: async () => {
      await container.stop();
    },
  };
};
