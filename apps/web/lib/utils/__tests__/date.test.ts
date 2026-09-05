import { afterEach, beforeEach, vi } from "vitest";

import { describe, expect, it } from "@/test-utils";

import { formatDateTime, formatDuration, formatRelativeDateTime } from "../date";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

describe("date", () => {
  describe("formatDuration", () => {
    it("should show whole seconds under a minute", () => {
      expect(formatDuration(45 * SECOND)).toBe("45s");
    });

    it("should truncate sub-second precision", () => {
      expect(formatDuration(45.9 * SECOND)).toBe("45s");
    });

    it("should show minutes and seconds under an hour", () => {
      expect(formatDuration(MINUTE + 52 * SECOND)).toBe("1m 52s");
    });

    it("should drop the seconds when a duration lands on a whole minute", () => {
      expect(formatDuration(3 * MINUTE)).toBe("3m");
    });

    it("should show hours and minutes past an hour", () => {
      expect(formatDuration(2 * HOUR + 5 * MINUTE)).toBe("2h 5m");
    });

    it("should drop the minutes when a duration lands on a whole hour", () => {
      expect(formatDuration(2 * HOUR)).toBe("2h");
    });

    it("should drop seconds past an hour rather than showing three units", () => {
      expect(formatDuration(HOUR + 30 * SECOND)).toBe("1h");
    });

    it("should clamp sub-second and negative durations to zero", () => {
      expect(formatDuration(400)).toBe("0s");
      expect(formatDuration(-5000)).toBe("0s");
    });
  });

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
});
