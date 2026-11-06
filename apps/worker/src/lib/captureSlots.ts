import { observeGauges } from "@ovr/metrics";

export type CaptureSlots = {
  track: <A extends unknown[], R>(
    processor: (...args: A) => Promise<R>,
  ) => (...args: A) => Promise<R>;
  observe: () => () => void;
};

// Busy against total slots shows whether captures are waiting for capacity this worker doesn't have.
export const createCaptureSlots = (slots: number): CaptureSlots => {
  let busy = 0;

  const track: CaptureSlots["track"] =
    (processor) =>
    async (...args) => {
      busy += 1;
      try {
        return await processor(...args);
      } finally {
        busy -= 1;
      }
    };

  const observe = () =>
    observeGauges(
      {
        slots: {
          name: "ovr.capture.slots",
          description: "Capture groups this worker can run at once.",
        },
        busy: {
          name: "ovr.capture.slots.busy",
          description: "Capture groups this worker is running.",
        },
      },
      (record) => {
        record("slots", slots);
        record("busy", busy);
      },
    );

  return { track, observe };
};
