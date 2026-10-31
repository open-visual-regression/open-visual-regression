import { CanvasChart, CanvasPulse, FadeInCards, Spinner } from "./Animated";

export default { title: "Animated" };

export const LoadingSpinner = { render: () => <Spinner /> };
export const FadeIn = { render: () => <FadeInCards /> };
export const BarChartAnimated = { render: () => <CanvasChart duration={800} bars={8} /> };
export const BarChartStatic = { render: () => <CanvasChart duration={0} bars={8} /> };
export const CanvasPulseEndless = { render: () => <CanvasPulse /> };
