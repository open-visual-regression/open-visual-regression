"server only";

import {
  createBuildStatusSubscriber,
  type BuildStatusEvent,
  type BuildStatusSubscriber,
} from "@ovr/queue/events";

type Listener = (event: BuildStatusEvent) => void;

type SubscriberFactory = (onEvent: Listener) => BuildStatusSubscriber;

export class BuildStatusHub {
  private subscriber: BuildStatusSubscriber | null = null;
  private readonly listeners = new Map<string, Set<Listener>>();

  constructor(private readonly createSubscriber: SubscriberFactory = createBuildStatusSubscriber) {}

  private ensureSubscriber(): void {
    this.subscriber ??= this.createSubscriber((event) => {
      const listeners = this.listeners.get(event.buildId);
      if (!listeners) {
        return;
      }
      for (const listener of [...listeners]) {
        listener(event);
      }
    });
  }

  subscribe(buildId: string, signal?: AbortSignal): AsyncIterable<BuildStatusEvent> {
    this.ensureSubscriber();

    const queue: BuildStatusEvent[] = [];
    let notify: (() => void) | null = null;

    const listener: Listener = (event) => {
      queue.push(event);
      notify?.();
      notify = null;
    };

    const listeners = this.listeners.get(buildId) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(buildId, listeners);

    const onAbort = () => {
      notify?.();
      notify = null;
    };
    signal?.addEventListener("abort", onAbort);

    const cleanup = () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(buildId);
      }
      signal?.removeEventListener("abort", onAbort);
    };

    return {
      async *[Symbol.asyncIterator]() {
        try {
          while (!signal?.aborted) {
            if (queue.length > 0) {
              yield queue.shift()!;
              continue;
            }
            await new Promise<void>((resolve) => {
              notify = resolve;
            });
          }
        } finally {
          cleanup();
        }
      },
    };
  }
}

declare global {
  // eslint-disable-next-line no-var
  var buildStatusHub: BuildStatusHub | undefined;
}

export const buildStatusHub = (globalThis.buildStatusHub ??= new BuildStatusHub());
