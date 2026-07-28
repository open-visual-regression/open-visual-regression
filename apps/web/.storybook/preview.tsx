import "../app/globals.css";
import type { Preview } from "@storybook/nextjs-vite";

import { QueryProvider } from "@/lib/providers/QueryProvider";

const preview: Preview = {
  parameters: {
    nextjs: {
      appDirectory: true,
    },
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
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
      return <Story />;
    },
    (Story) => (
      <QueryProvider>
        <Story />
      </QueryProvider>
    ),
  ],
};

export default preview;
