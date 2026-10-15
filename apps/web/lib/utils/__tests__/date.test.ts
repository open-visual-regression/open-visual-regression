import { afterEach, beforeEach, vi } from "vitest";

import { describe, expect, it } from "@/test-utils";

import { formatDateTime, formatDuration, formatRelativeDateTime } from "../date";

describe("date", () => {
  describe("formatDateTime", () => {
    it("should format a date as YYYY-MM-DD and a 12-hour time", () => {
      expect(formatDateTime(new Date("2026-06-15T16:30:00.000Z"))).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2} (AM|PM)$/,
      );
    });
  });

  describe("formatRelativeDateTime", () => {
    const NOW = new Date("2026-06-15T12:00:00.000Z");

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should show seconds for times less than a minute ago", () => {
      expect(formatRelativeDateTime(new Date("2026-06-15T11:59:30.000Z"))).toBe("30 seconds ago");
    });

    it("should show minutes for times less than an hour ago", () => {
      expect(formatRelativeDateTime(new Date("2026-06-15T11:45:00.000Z"))).toBe("15 minutes ago");
    });

    it("should show hours for times less than a day ago", () => {
      expect(formatRelativeDateTime(new Date("2026-06-15T06:00:00.000Z"))).toBe("6 hours ago");
    });

    it("should fall back to an absolute date/time for times a day or more ago", () => {
      const date = new Date("2026-06-13T12:00:00.000Z");
      expect(formatRelativeDateTime(date)).toBe(formatDateTime(date));
    });
  });

  describe("formatDuration", () => {
    it.each([
      [450, "450ms"],
      [3_456, "3.4s"],
      [12_900, "12s"],
      [65_000, "1m 5s"],
      [7_380_000, "2h 3m"],
    ])("should format %ims as %s", (ms, expected) => {
      expect(formatDuration(ms)).toBe(expected);
    });
  });
});
