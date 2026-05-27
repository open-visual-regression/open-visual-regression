import { PostgreSqlContainer } from "@testcontainers/postgresql";

export const startPostgres = async (): Promise<{
  connectionString: string;
  stop: () => Promise<void>;
}> => {
  const container = await new PostgreSqlContainer("postgres:16-alpine").start();
  return {
    connectionString: container.getConnectionUri(),
    stop: async () => {
      await container.stop();
    },
  };
};
