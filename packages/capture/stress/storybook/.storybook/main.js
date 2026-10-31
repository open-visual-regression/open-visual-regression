export default {
  stories: ["../src/**/*.stories.jsx"],
  framework: "@storybook/react-vite",
  viteFinal: async (config) => {
    config.esbuild = { ...(config.esbuild ?? {}), jsx: "automatic" };
    return config;
  },
};
