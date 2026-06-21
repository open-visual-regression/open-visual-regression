import { describe, expect, it, vi } from "vitest";
import { getApiKey } from "../config";

describe("getApiKey", () => {
  it("should return the API key when OVR_API_KEY is set", () => {
    vi.stubEnv("OVR_API_KEY", "test-key");

    expect(getApiKey()).toBe("test-key");
  });

  it("should exit with a clear message when OVR_API_KEY is missing", () => {
    vi.stubEnv("OVR_API_KEY", undefined);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    getApiKey();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("OVR_API_KEY"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
