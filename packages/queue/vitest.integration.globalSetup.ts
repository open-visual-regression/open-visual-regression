import {
  startValkey,
  startValkeyCluster,
  type ValkeyClusterContainer,
  type ValkeyContainer,
} from "@ovr/testing";

let valkey: ValkeyContainer;
let valkeyCluster: ValkeyClusterContainer;

export async function setup() {
  [valkey, valkeyCluster] = await Promise.all([startValkey(), startValkeyCluster()]);

  process.env.REDIS_HOST = valkey.host;
  process.env.REDIS_PORT = String(valkey.port);
  process.env.REDIS_CLUSTER_URL = valkeyCluster.url;
}

export async function teardown() {
  await Promise.all([valkey?.stop(), valkeyCluster?.stop()]);
}
