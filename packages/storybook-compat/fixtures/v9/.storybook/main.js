export default {
  stories: ["../src/**/*.stories.jsx"],
  addons: ["@storybook/addon-docs"],
  framework: "@storybook/react-vite",
  viteFinal: async (config) => {
    config.esbuild = { ...(config.esbuild ?? {}), jsx: "automatic" };
    return config;
  },
};
