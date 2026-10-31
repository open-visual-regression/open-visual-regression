import { useEffect, useRef } from "react";

export const Spinner = () => <div className="spinner" />;

export const FadeInCards = () => (
  <div className="grid">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="card fade-in">
        Card {i}
      </div>
    ))}
  </div>
);

// Draws bars that grow over `duration` ms, like Chart.js's default animation.
export const CanvasChart = ({ duration, bars }) => {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = ref.current.getContext("2d");
    const start = performance.now();
    let frame;
    const draw = (now) => {
      const t = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      ctx.clearRect(0, 0, 480, 240);
      for (let i = 0; i < bars; i++) {
        const h = (40 + ((i * 53) % 160)) * eased;
        ctx.fillStyle = "#4f46e5";
        ctx.fillRect(10 + i * (460 / bars), 230 - h, 460 / bars - 6, h);
      }
      if (t < 1) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [duration, bars]);
  return <canvas ref={ref} width={480} height={240} />;
};

// Never stops animating, like a canvas loading indicator or a particle background.
export const CanvasPulse = () => {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = ref.current.getContext("2d");
    let frame;
    const draw = (now) => {
      ctx.clearRect(0, 0, 120, 120);
      ctx.fillStyle = "#db2777";
      ctx.beginPath();
      ctx.arc(60, 60, 30 + Math.sin(now / 200) * 20, 0, Math.PI * 2);
      ctx.fill();
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={ref} width={120} height={120} />;
};
