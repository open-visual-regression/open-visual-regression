import { Button } from "./Button";

export default {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
};

export const Default = {
  args: { label: "Default" },
};

export const WithOvrParameters = {
  args: { label: "Overridden" },
  parameters: {
    ovr: {
      viewports: [{ width: 320, height: 240 }],
      diffThreshold: 0.5,
    },
  },
};

export const Skipped = {
  args: { label: "Skipped" },
  parameters: { ovr: { skip: true } },
};

export const WithPlay = {
  args: { label: "Played" },
  play: async ({ canvasElement }) => {
    if (!canvasElement.querySelector("[data-testid='fixture-button']")) {
      throw new Error("button did not render");
    }
  },
};

export const PlayThrows = {
  args: { label: "Throws" },
  play: async () => {
    throw new Error("intentional play failure");
  },
};
