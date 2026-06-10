import { PostgreSqlContainer } from "@testcontainers/postgresql";

export type StartedPostgres = {
  connectionString: string;
  stop: () => Promise<void>;
};

export const startPostgres = async (): Promise<StartedPostgres> => {
  const container = await new PostgreSqlContainer("postgres:16-alpine").start();

  return {
    connectionString: container.getConnectionUri(),
    stop: async () => {
      await container.stop();
    },
  };
};
