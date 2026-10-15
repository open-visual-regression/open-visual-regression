const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export const formatDateTime = (date: Date): string =>
  `${dateFormatter.format(date)} ${timeFormatter.format(date)}`;

const RELATIVE_TIME_THRESHOLD_MS = 24 * 60 * 60 * 1000;

const RELATIVE_TIME_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
];

const formatRelativeDuration = (
  durationSeconds: number,
  [division, ...remainingDivisions]: typeof RELATIVE_TIME_DIVISIONS,
): string => {
  if (!division || Math.abs(durationSeconds) < division.amount) {
    return relativeTimeFormatter.format(Math.round(durationSeconds), division?.unit ?? "hours");
  }

  return formatRelativeDuration(durationSeconds / division.amount, remainingDivisions);
};

/** Relative time (e.g. "5 minutes ago") within 24h, otherwise an absolute date/time. */
export const formatRelativeDateTime = (date: Date): string => {
  const diffMs = date.getTime() - Date.now();

  if (Math.abs(diffMs) >= RELATIVE_TIME_THRESHOLD_MS) {
    return formatDateTime(date);
  }

  return formatRelativeDuration(diffMs / 1000, RELATIVE_TIME_DIVISIONS);
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }

  const seconds = ms / 1000;
  if (seconds < 10) {
    return `${(Math.floor(seconds * 10) / 10).toString()}s`;
  }

  const totalSeconds = Math.floor(seconds);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m ${totalSeconds % 60}s`;
  }

  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
};
