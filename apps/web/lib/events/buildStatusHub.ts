"server only";

import { EventPublisher } from "@orpc/server";

import {
  createBuildStatusSubscriber,
  type BuildStatusEvent,
  type BuildStatusSubscriber,
} from "@ovr/queue/events";

type SubscriberFactory = (onEvent: (event: BuildStatusEvent) => void) => BuildStatusSubscriber;

export class BuildStatusHub {
  private readonly publisher = new EventPublisher<Record<string, BuildStatusEvent>>();
  private subscriber: BuildStatusSubscriber | null = null;

  constructor(private readonly createSubscriber: SubscriberFactory = createBuildStatusSubscriber) {}

  subscribe(buildId: string, signal?: AbortSignal): AsyncGenerator<BuildStatusEvent> {
    this.subscriber ??= this.createSubscriber((event) =>
      this.publisher.publish(event.buildId, event),
    );
    return this.publisher.subscribe(buildId, { signal });
  }
}

export const buildStatusHub = new BuildStatusHub();
