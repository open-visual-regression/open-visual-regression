import { metrics } from "@opentelemetry/api";
import { PrometheusExporter, PrometheusSerializer } from "@opentelemetry/exporter-prometheus";
import { MeterProvider } from "@opentelemetry/sdk-metrics";

export type TestMetrics = {
  scrape: () => Promise<string>;
};

// eslint-disable-next-line no-empty-pattern
export const metricsFixture = async ({}, use: (metrics: TestMetrics) => Promise<void>) => {
  const exporter = new PrometheusExporter({ preventServerStart: true });
  const provider = new MeterProvider({ readers: [exporter] });
  const serializer = new PrometheusSerializer(undefined, undefined, undefined, true, true);
  metrics.setGlobalMeterProvider(provider);

  await use({
    scrape: async () => serializer.serialize((await exporter.collect()).resourceMetrics),
  });

  metrics.disable();
  await provider.shutdown();
};
