import { headers } from "next/headers";
import { vi } from "vitest";

// Sends the next request with this token, as a CLI or agent would. The test must mock next/headers.
export const asBearer = (token: string) => {
  vi.mocked(headers).mockResolvedValue(new Headers({ authorization: `Bearer ${token}` }));
};
