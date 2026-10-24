import { metrics } from "@opentelemetry/api";
import type {
  Attributes,
  BatchObservableCallback,
  Meter,
  MeterProvider,
  MetricOptions,
  ObservableGauge,
  ObservableResult,
} from "@opentelemetry/api";

export const METER_NAME = "ovr";

export type Counter<A extends Attributes> = {
  add: (value: number, attributes: A) => void;
};

export type Histogram<A extends Attributes> = {
  record: (value: number, attributes: A) => void;
};

export type HistogramOptions = MetricOptions & {
  /** Bucket upper bounds, in the histogram's unit. */
  buckets?: number[];
};

// Created on first use, since instruments made before the app registers a provider stay no-op.
const lazy = <T>(create: (meter: Meter) => T): (() => T) => {
  let provider: MeterProvider | undefined;
  let instrument: T | undefined;

  return () => {
    const current = metrics.getMeterProvider();
    if (current !== provider || instrument === undefined) {
      provider = current;
      instrument = create(current.getMeter(METER_NAME));
    }
    return instrument;
  };
};

// End names in their unit (`.seconds`): the exporter doesn't add one. Never label with ids.
export const createCounter = <A extends Attributes = Record<string, never>>(
  name: string,
  options: MetricOptions,
): Counter<A> => {
  const counter = lazy((meter) => meter.createCounter<A>(name, options));
  return { add: (value, attributes) => counter().add(value, attributes) };
};

export const createHistogram = <A extends Attributes = Record<string, never>>(
  name: string,
  { buckets, ...options }: HistogramOptions,
): Histogram<A> => {
  const histogram = lazy((meter) =>
    meter.createHistogram<A>(name, {
      ...options,
      advice: buckets ? { explicitBucketBoundaries: buckets } : undefined,
    }),
  );
  return { record: (value, attributes) => histogram().record(value, attributes) };
};

export type GaugeObserver<A extends Attributes> = (
  result: ObservableResult<A>,
) => void | Promise<void>;

// Unlike counters, register gauges after the app starts metrics, or they never report.
export const observeGauge = <A extends Attributes = Record<string, never>>(
  name: string,
  options: MetricOptions,
  observer: GaugeObserver<A>,
): (() => void) => {
  const gauge = metrics.getMeter(METER_NAME).createObservableGauge<A>(name, options);
  gauge.addCallback(observer);
  return () => gauge.removeCallback(observer);
};

export type GaugeDefinition = MetricOptions & { name: string };

export const observeGauges = <K extends string>(
  gauges: Record<K, GaugeDefinition>,
  observer: (
    observe: (gauge: K, value: number, attributes?: Attributes) => void,
  ) => void | Promise<void>,
): (() => void) => {
  const meter = metrics.getMeter(METER_NAME);
  const instruments = Object.fromEntries(
    Object.entries<GaugeDefinition>(gauges).map(([key, { name, ...options }]) => [
      key,
      meter.createObservableGauge(name, options),
    ]),
  ) as Record<K, ObservableGauge>;
  const observables = Object.values<ObservableGauge>(instruments);

  const callback: BatchObservableCallback = (result) =>
    observer((gauge, value, attributes) => result.observe(instruments[gauge], value, attributes));

  meter.addBatchObservableCallback(callback, observables);
  return () => meter.removeBatchObservableCallback(callback, observables);
};

export const DURATION_BUCKETS_SECONDS = [
  0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 120, 300, 600, 1800,
];
