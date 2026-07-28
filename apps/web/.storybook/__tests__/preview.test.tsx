import type { Decorator } from "@storybook/nextjs-vite";
import { useQuery } from "@tanstack/react-query";

import { describe, expect, it, render, screen } from "@/test-utils";

import preview from "../preview";

const StoryUsingQuery = () => {
  const { data } = useQuery({
    queryKey: ["ping"],
    queryFn: () => Promise.resolve("pong"),
    initialData: "pong",
  });
  return <div>{data}</div>;
};

// Mirrors how Storybook composes project decorators around a story: each
// decorator wraps the one after it, closest to the story first.
// https://storybook.js.org/docs/writing-stories/decorators
const applyDecorators = (decorators: Decorator[]) =>
  decorators.reduceRight<() => React.ReactElement>(
    (Story, decorator) => () => decorator(Story, {} as never) as React.ReactElement,
    StoryUsingQuery,
  );

describe("Storybook preview decorators", () => {
  it("wraps stories in a QueryClientProvider so components using useQuery don't crash", () => {
    const DecoratedStory = applyDecorators(preview.decorators ?? []);

    render(<DecoratedStory />);

    expect(screen.getByText("pong")).toBeVisible();
  });
});
