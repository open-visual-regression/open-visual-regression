import "../src/styles/globals.css";

import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "oklch(0.155 0.006 270)" },
        { name: "light", value: "oklch(0.99 0 0)" },
      ],
    },
  },
  decorators: [
    (Story) => {
      document.documentElement.classList.add("dark");
      return <Story />;
    },
  ],
};

export default preview;
