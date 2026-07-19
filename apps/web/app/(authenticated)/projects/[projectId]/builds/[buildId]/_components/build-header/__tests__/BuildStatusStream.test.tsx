import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { type BuildStatus } from "@ovr/api/contracts/builds";

import { orpc } from "@/lib/orpc/client";
import { act, describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { BuildStatusStream } from "../BuildStatusStream";

vi.mock("next/navigation");

const mockRefresh = vi.mocked(useRouter)().refresh;

const liveKey = (buildId: string) =>
  orpc.builds.watchStatus.experimental_liveKey({ input: { buildId } });

const renderStream = (buildId: string, initialStatus: BuildStatus, status: BuildStatus) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData(liveKey(buildId), { status });

  return {
    queryClient,
    ...render(<BuildStatusStream buildId={buildId} initialStatus={initialStatus} />, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    }),
  };
};

describe("BuildStatusStream", () => {
  it("renders the streamed status", () => {
    renderStream("build-1", "processing", "processing");

    expect(screen.getByRole("status")).toHaveTextContent("processing");
  });

  it("updates the badge and refreshes the page when the status changes", async () => {
    const { queryClient } = renderStream("build-1", "processing", "processing");

    act(() => {
      queryClient.setQueryData(liveKey("build-1"), { status: "unchanged" });
    });

    expect(await screen.findByText("unchanged")).toBeVisible();
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
  });

  it("does not refresh the page for the initial status", () => {
    renderStream("build-1", "processing", "processing");

    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
