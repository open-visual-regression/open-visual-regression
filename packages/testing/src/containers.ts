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

const VALKEY_CLUSTER_ENTRY_PORT = 7000;
const VALKEY_CLUSTER_PORTS = [VALKEY_CLUSTER_ENTRY_PORT, 7001, 7002];

export type ValkeyClusterContainer = {
  url: string;
  stop: () => Promise<void>;
};

// Nodes announce the host's mapped ports so clients outside Docker can follow redirects.
export const startValkeyCluster = async (): Promise<ValkeyClusterContainer> => {
  const servers = VALKEY_CLUSTER_PORTS.map(
    (port) =>
      `valkey-server --port ${port} --cluster-enabled yes --cluster-config-file nodes-${port}.conf --appendonly no --save '' --daemonize yes`,
  );
  const container = await new GenericContainer("valkey/valkey:8-alpine")
    .withExposedPorts(...VALKEY_CLUSTER_PORTS)
    .withCommand(["sh", "-c", `${servers.join(" && ")} && tail -f /dev/null`])
    .withWaitStrategy(Wait.forListeningPorts())
    .withStartupTimeout(120_000)
    .start();

  const exec = async (command: string[]): Promise<string> => {
    const result = await container.exec(command);
    if (result.exitCode !== 0) {
      throw new Error(`${command.join(" ")} failed: ${result.output}`);
    }
    return result.output;
  };

  await exec([
    "valkey-cli",
    "--cluster",
    "create",
    ...VALKEY_CLUSTER_PORTS.map((port) => `127.0.0.1:${port}`),
    "--cluster-yes",
  ]);

  const host = container.getHost();
  for (const port of VALKEY_CLUSTER_PORTS) {
    const announce: [string, string][] = [
      ["cluster-announce-hostname", host],
      ["cluster-announce-port", String(container.getMappedPort(port))],
      ["cluster-announce-bus-port", String(port + 10_000)],
      ["cluster-preferred-endpoint-type", "hostname"],
    ];
    for (const [name, value] of announce) {
      await exec(["valkey-cli", "-p", String(port), "config", "set", name, value]);
    }
  }

  // Wait until every node has gossiped the announced ports.
  const mappedPorts = VALKEY_CLUSTER_PORTS.map((port) => String(container.getMappedPort(port)));
  const converged = async (): Promise<boolean> => {
    for (const port of VALKEY_CLUSTER_PORTS) {
      const slots = await exec(["valkey-cli", "-p", String(port), "cluster", "slots"]);
      const info = await exec(["valkey-cli", "-p", String(port), "cluster", "info"]);
      const announced = slots.split("\n").map((line) => line.trim());
      if (
        !info.includes("cluster_state:ok") ||
        !mappedPorts.every((mapped) => announced.includes(mapped))
      ) {
        return false;
      }
    }
    return true;
  };

  const deadline = Date.now() + 30_000;
  while (!(await converged())) {
    if (Date.now() > deadline) {
      throw new Error("valkey cluster did not converge");
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return {
    url: `redis://${host}:${container.getMappedPort(VALKEY_CLUSTER_ENTRY_PORT)}`,
    stop: async () => {
      await container.stop();
    },
  };
};
