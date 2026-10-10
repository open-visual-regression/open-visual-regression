import { lazy, Suspense } from "react";

const Card = lazy(() => import("./Card").then(({ Card }) => ({ default: Card })));

export default {
  title: "Components/Lazy",
};

export const Default = {
  render: () => (
    <Suspense fallback={null}>
      <Card>Lazy</Card>
    </Suspense>
  ),
};
