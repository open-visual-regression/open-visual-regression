import { describe, expect, it } from "vitest";

import { readWebpackImporters, type WebpackStats } from "../webpackStats";

const read = (
  modules: WebpackStats["modules"],
  storyFiles: string[] = [],
): Record<string, string[]> =>
  Object.fromEntries(readWebpackImporters({ modules }, new Set(storyFiles)));

const STORIES_CONTEXT =
  "./src/ lazy ^\\.\\/.*$ include: (?:\\/src(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.).)*?)\\/|\\/|$)(?!\\.)(?=.)[^/]*?\\.stories\\.jsx)$ chunkName: [request] namespace object";

describe("readWebpackImporters", () => {
  it("reads the modules inside a concatenated module", () => {
    expect(
      read([
        {
          name: "./src/Button.stories.jsx + 1 modules",
          reasons: [{ moduleName: "./storybook-stories.js" }],
          modules: [
            { name: "./src/Button.stories.jsx", reasons: [] },
            { name: "./src/Button.jsx", reasons: [{ moduleName: "./src/Button.stories.jsx" }] },
          ],
        },
      ]),
    ).toEqual({
      "./src/Button.stories.jsx": ["./storybook-stories.js"],
      "./src/Button.jsx": ["./src/Button.stories.jsx"],
    });
  });

  it("follows a reason that names a concatenated module", () => {
    expect(
      read([
        {
          name: "./src/tones.js",
          reasons: [{ moduleName: "./src/Button.stories.jsx + 2 modules" }],
        },
      ]),
    ).toEqual({ "./src/tones.js": ["./src/Button.stories.jsx"] });
  });

  it("skips reasons without a module, as an entry point has", () => {
    expect(
      read([
        { name: "./storybook-config-entry.js", reasons: [{ moduleName: null }] },
        { name: "./.storybook/preview.js", reasons: [{}] },
      ]),
    ).toEqual({ "./storybook-config-entry.js": [], "./.storybook/preview.js": [] });
  });

  it("reads the file behind a loader and its query", () => {
    expect(
      read([
        { name: "./src/Button.css", reasons: [{ moduleName: "./src/Button.jsx" }] },
        {
          name: "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[6].use[1]!./src/Button.css?inline",
          reasons: [{ moduleName: "./src/Button.css" }],
        },
      ]),
    ).toEqual({ "./src/Button.css": ["./src/Button.jsx"] });
  });

  it("links a module loaded through a context module to what created the context", () => {
    expect(
      read(
        [
          { name: STORIES_CONTEXT, reasons: [{ moduleName: "./storybook-stories.js" }] },
          { name: "./src/Card.stories.jsx", reasons: [{ moduleName: STORIES_CONTEXT }] },
          {
            name: "./src/icons sync ^\\.\\/.*\\.svg$",
            reasons: [{ moduleName: "./src/Icon.jsx" }],
          },
          {
            name: "./src/icons/star.svg",
            reasons: [{ moduleName: "./src/icons sync ^\\.\\/.*\\.svg$" }],
          },
        ],
        ["./src/Card.stories.jsx"],
      ),
    ).toEqual({
      "./src/Card.stories.jsx": ["./storybook-stories.js"],
      "./src/icons/star.svg": ["./src/Icon.jsx"],
    });
  });

  it("reads the context modules Rspack writes", () => {
    const context =
      "./src|lazy|/^\\.\\/.*$/|include: /\\.stories\\.jsx$/|chunkName: [request]|namespace object";

    expect(
      read(
        [
          { name: context, reasons: [{ moduleName: "./storybook-stories.js" }] },
          { name: "./src/Card.stories.jsx", reasons: [{ moduleName: context }] },
        ],
        ["./src/Card.stories.jsx"],
      ),
    ).toEqual({ "./src/Card.stories.jsx": ["./storybook-stories.js"] });
  });

  it("reads names written without a leading ./", () => {
    expect(
      read([{ name: "src/Button.jsx", reasons: [{ moduleName: "./src/Button.stories.jsx" }] }]),
    ).toEqual({ "./src/Button.jsx": ["./src/Button.stories.jsx"] });
  });

  it("ignores a stories glob loading anything but a story file", () => {
    expect(
      read(
        [
          { name: STORIES_CONTEXT, reasons: [{ moduleName: "storybook-stories.js" }] },
          { name: "./src/Button.stories.jsx", reasons: [{ moduleName: STORIES_CONTEXT }] },
          { name: "./src/Button.jsx", reasons: [{ moduleName: STORIES_CONTEXT }] },
          { name: "src/Button.jsx", reasons: [{ moduleName: "./src/Button.stories.jsx" }] },
        ],
        ["./src/Button.stories.jsx"],
      ),
    ).toEqual({
      "./src/Button.stories.jsx": ["./storybook-stories.js"],
      "./src/Button.jsx": ["./src/Button.stories.jsx"],
    });
  });

  it("leaves out modules that are not files", () => {
    expect(
      read([
        { name: "webpack/runtime/define property getters", reasons: [] },
        { name: 'external "react"', reasons: [{ moduleName: "./src/Button.jsx" }] },
        { name: "./src/Button.jsx", reasons: [{ moduleName: "webpack/runtime/load script" }] },
      ]),
    ).toEqual({ "./src/Button.jsx": [] });
  });

  it("keeps modules outside the directory Storybook was built in", () => {
    expect(
      read([
        { name: "../../packages/ui/src/utils.ts", reasons: [{ moduleName: "./src/Button.jsx" }] },
      ]),
    ).toEqual({ "../../packages/ui/src/utils.ts": ["./src/Button.jsx"] });
  });
});
