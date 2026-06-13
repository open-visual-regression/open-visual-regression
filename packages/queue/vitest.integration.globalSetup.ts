import { startValkey, type ValkeyContainer } from "@ovr/testing";

let valkey: ValkeyContainer;

export async function setup() {
  valkey = await startValkey();

  process.env.REDIS_HOST = valkey.host;
  process.env.REDIS_PORT = String(valkey.port);
}

export async function teardown() {
  await valkey?.stop();
}
