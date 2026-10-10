export default {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.jsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-webpack5-compiler-swc"],
  framework: "@storybook/react-webpack5",
  swc: (config) => ({
    ...config,
    jsc: {
      ...config.jsc,
      parser: { syntax: "ecmascript", jsx: true },
      transform: { react: { runtime: "automatic" } },
    },
  }),
};
