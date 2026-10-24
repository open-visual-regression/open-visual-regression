import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { monitorEventLoopDelay } from "node:perf_hooks";
import { getHeapSpaceStatistics } from "node:v8";

import { metrics, type Meter } from "@opentelemetry/api";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { MeterProvider } from "@opentelemetry/sdk-metrics";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { z } from "zod";

import { createLogger } from "@ovr/logger";

import { METER_NAME } from "./index";

const logger = createLogger("metrics");

const portSchema = z.coerce.number().int().min(0).max(65_535);

const readPort = (): number | undefined => {
  const value = process.env.OVR_METRICS_PORT;
  if (!value) {
    return undefined;
  }

  const port = portSchema.safeParse(value);
  if (!port.success) {
    logger.error({ value }, "OVR_METRICS_PORT must be a port number, so metrics are off");
    return undefined;
  }
  return port.data;
};

export type MetricsOptions = {
  serviceName: string;
  serviceVersion?: string;
  /** Defaults to OVR_METRICS_PORT. Metrics stay off when neither is set. */
  port?: number;
  /** Defaults to OVR_METRICS_HOST, then every interface. */
  host?: string;
};

export type Metrics = {
  port: number;
  shutdown: () => Promise<void>;
};

const listen = (server: Server, port: number, host: string): Promise<number> =>
  new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve((server.address() as AddressInfo).port);
    });
  });

const close = (server: Server): Promise<void> =>
  new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

// OpenTelemetry's runtime metric names.
const observeRuntime = (meter: Meter): void => {
  const eventLoopDelay = monitorEventLoopDelay({ resolution: 20 });
  eventLoopDelay.enable();

  meter
    .createObservableGauge("process.memory.usage.bytes", {
      description: "Resident set size of the process, worker threads included.",
      unit: "By",
    })
    .addCallback((result) => {
      result.observe(process.memoryUsage().rss);
    });

  meter
    .createObservableGauge("v8js.memory.heap.used.bytes", {
      description: "V8 heap memory in use, by heap space.",
      unit: "By",
    })
    .addCallback((result) => {
      for (const space of getHeapSpaceStatistics()) {
        result.observe(space.space_used_size, { "v8js.heap.space.name": space.space_name });
      }
    });

  meter
    .createObservableCounter("process.cpu.time.seconds", {
      description: "CPU time spent by the process.",
      unit: "s",
    })
    .addCallback((result) => {
      const { user, system } = process.cpuUsage();
      result.observe(user / 1e6, { "cpu.mode": "user" });
      result.observe(system / 1e6, { "cpu.mode": "system" });
    });

  // Reset each scrape, so it covers the time since the last one.
  meter
    .createObservableGauge("nodejs.eventloop.delay.p99.seconds", {
      description: "99th percentile event loop delay since the previous collection.",
      unit: "s",
    })
    .addCallback((result) => {
      result.observe(eventLoopDelay.percentile(99) / 1e9);
      eventLoopDelay.reset();
    });
};

// Returns null when metrics are off. A bad or taken port is logged, never fatal.
export const startMetrics = async ({
  serviceName,
  serviceVersion,
  port = readPort(),
  host = process.env.OVR_METRICS_HOST || "0.0.0.0",
}: MetricsOptions): Promise<Metrics | null> => {
  if (port === undefined) {
    return null;
  }

  const exporter = new PrometheusExporter({ preventServerStart: true, withoutScopeInfo: true });
  const provider = new MeterProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
    }),
    readers: [exporter],
  });

  const server = createServer((request, response) => {
    if (request.method === "GET" && request.url?.split("?")[0] === "/metrics") {
      exporter.getMetricsRequestHandler(request, response);
      return;
    }
    response.statusCode = 404;
    response.end();
  });

  let boundPort: number;
  try {
    boundPort = await listen(server, port, host);
  } catch (error) {
    logger.error({ err: error, port, host }, "failed to serve metrics, so metrics are off");
    await provider.shutdown();
    return null;
  }

  metrics.setGlobalMeterProvider(provider);
  observeRuntime(provider.getMeter(METER_NAME));

  logger.info({ port: boundPort, host }, "serving metrics");

  return {
    port: boundPort,
    shutdown: async () => {
      metrics.disable();
      await Promise.all([close(server), provider.shutdown()]);
    },
  };
};
