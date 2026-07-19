"server only";

import { EventEmitter, on } from "node:events";

import {
  createBuildStatusSubscriber,
  type BuildStatusEvent,
  type BuildStatusSubscriber,
} from "@ovr/queue/events";

type SubscriberFactory = (onEvent: (event: BuildStatusEvent) => void) => BuildStatusSubscriber;

// `on()` buffers events from the moment it is called, so unwrapping it in a
// separate generator keeps the listener attached synchronously in `subscribe`
// while still tolerating an aborted signal.
async function* unwrap(
  source: AsyncIterable<unknown[]>,
  signal?: AbortSignal,
): AsyncGenerator<BuildStatusEvent> {
  try {
    for await (const [event] of source) {
      yield event as BuildStatusEvent;
    }
  } catch (error) {
    if (!signal?.aborted) {
      throw error;
    }
  }
}

export class BuildStatusHub {
  private readonly emitter = new EventEmitter();
  private subscriber: BuildStatusSubscriber | null = null;

  constructor(private readonly createSubscriber: SubscriberFactory = createBuildStatusSubscriber) {
    // One listener per open build page; there is no meaningful ceiling.
    this.emitter.setMaxListeners(0);
  }

  subscribe(buildId: string, signal?: AbortSignal): AsyncGenerator<BuildStatusEvent> {
    this.subscriber ??= this.createSubscriber((event) => this.emitter.emit(event.buildId, event));
    return unwrap(on(this.emitter, buildId, { signal }), signal);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var buildStatusHub: BuildStatusHub | undefined;
}

export const buildStatusHub = (globalThis.buildStatusHub ??= new BuildStatusHub());
