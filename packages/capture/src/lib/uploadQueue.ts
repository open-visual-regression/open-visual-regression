export type UploadQueue = {
  add: (task: () => Promise<void>) => Promise<void>;
  drain: () => Promise<void>;
};

export const createUploadQueue = (limit: number): UploadQueue => {
  const inFlight = new Set<Promise<void>>();
  let failure: unknown;

  const track = (task: () => Promise<void>): void => {
    const run: Promise<void> = task()
      .catch((error: unknown) => {
        failure ??= error;
      })
      .finally(() => inFlight.delete(run));

    inFlight.add(run);
  };

  return {
    add: async (task) => {
      if (inFlight.size >= limit) {
        await Promise.race(inFlight);
      }

      track(task);
    },
    drain: async () => {
      await Promise.all(inFlight);

      if (failure !== undefined) {
        const error = failure;
        failure = undefined;
        throw error;
      }
    },
  };
};
