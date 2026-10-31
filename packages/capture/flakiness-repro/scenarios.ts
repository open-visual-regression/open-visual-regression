// Each scenario is a page that starts rendering on load, standing in for a story that has just
// rendered. `mask` lists selectors a Playwright-style `mask` option would cover.

export type Scenario = {
  name: string;
  description: string;
  html: string;
  mask?: string[];
};

const page = (body: string) => `<!doctype html>
<html>
  <head>
    <style>
      body { margin: 0; padding: 24px; font: 16px/1.4 sans-serif; background: #fff; }
    </style>
  </head>
  <body>${body}</body>
</html>`;

export const scenarios: Scenario[] = [
  {
    name: "canvas-chart-animation",
    description:
      "Bar chart drawn on a <canvas> that animates in over 800ms with requestAnimationFrame, like Chart.js or ECharts. Canvas drawing never mutates the DOM.",
    html: page(`
      <h3>Revenue</h3>
      <canvas id="chart" width="480" height="240"></canvas>
      <script>
        const ctx = document.getElementById("chart").getContext("2d");
        const values = [40, 85, 60, 120, 95, 150];
        const DURATION = 800;
        const start = performance.now();
        const ease = (t) => 1 - Math.pow(1 - t, 3);
        const draw = (now) => {
          const t = Math.min((now - start) / DURATION, 1);
          ctx.clearRect(0, 0, 480, 240);
          values.forEach((value, index) => {
            const h = value * ease(t);
            ctx.fillStyle = "#4f46e5";
            ctx.fillRect(20 + index * 75, 230 - h, 50, h);
          });
          if (t < 1) requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);
      </script>
    `),
  },
  {
    name: "timestamp-and-random-id",
    description:
      'Renders "Last updated" from new Date(), updated every second, plus a random request ID. Nothing in the component changes between builds.',
    mask: ["#updated", "#request-id"],
    html: page(`
      <div style="border:1px solid #ddd;padding:12px;width:420px">
        <strong>Deploy status: healthy</strong>
        <div>Last updated: <span id="updated"></span></div>
        <div>Request: <code id="request-id"></code></div>
      </div>
      <script>
        const render = () => {
          document.getElementById("updated").textContent = new Date().toLocaleTimeString("en-US");
        };
        render();
        setInterval(render, 1000);
        document.getElementById("request-id").textContent = Math.random().toString(36).slice(2, 12);
      </script>
    `),
  },
  {
    name: "control-autofocus-caret",
    description:
      "Autofocused text input. Without caret hiding, the blinking caret is caught on or off at random.",
    html: page(`<input autofocus value="hello" style="font-size:24px;padding:8px" />`),
  },
  {
    name: "control-css-transition",
    description: "Card that fades and slides in with a 600ms CSS transition.",
    html: page(`
      <div id="card" style="width:300px;height:120px;background:#16a34a;opacity:0;transform:translateX(-80px);transition:all 600ms ease">
      </div>
      <script>
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const card = document.getElementById("card");
          card.style.opacity = "1";
          card.style.transform = "none";
        }));
      </script>
    `),
  },
  {
    name: "control-js-style-animation",
    description:
      "Spring-style animation driven from JS that writes element.style each frame for 600ms, like react-spring or framer-motion.",
    html: page(`
      <div id="box" style="width:120px;height:120px;background:#db2777"></div>
      <script>
        const box = document.getElementById("box");
        const start = performance.now();
        const step = (now) => {
          const t = Math.min((now - start) / 600, 1);
          box.style.transform = "translateX(" + (300 * t) + "px)";
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      </script>
    `),
  },
  {
    name: "delayed-content-no-network",
    description:
      "Banner shown by setTimeout 400ms after render, with no request and no DOM change in between.",
    html: page(`
      <div style="width:420px;height:60px;border:1px dashed #aaa">
        <div id="banner" hidden style="background:#f59e0b;padding:16px">Welcome back!</div>
      </div>
      <script>
        setTimeout(() => { document.getElementById("banner").hidden = false; }, 400);
      </script>
    `),
  },
];
