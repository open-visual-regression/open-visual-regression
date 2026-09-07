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

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

export const formatDuration = (durationMs: number): string => {
  if (durationMs < MS_PER_SECOND) {
    return "0s";
  }

  if (durationMs < MS_PER_MINUTE) {
    return `${Math.floor(durationMs / MS_PER_SECOND)}s`;
  }

  if (durationMs < MS_PER_HOUR) {
    const minutes = Math.floor(durationMs / MS_PER_MINUTE);
    const seconds = Math.floor((durationMs % MS_PER_MINUTE) / MS_PER_SECOND);
    return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
  }

  const hours = Math.floor(durationMs / MS_PER_HOUR);
  const minutes = Math.floor((durationMs % MS_PER_HOUR) / MS_PER_MINUTE);
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
};

/** Relative time (e.g. "5 minutes ago") within 24h, otherwise an absolute date/time. */
export const formatRelativeDateTime = (date: Date): string => {
  const diffMs = date.getTime() - Date.now();

  if (Math.abs(diffMs) >= RELATIVE_TIME_THRESHOLD_MS) {
    return formatDateTime(date);
  }

  return formatRelativeDuration(diffMs / 1000, RELATIVE_TIME_DIVISIONS);
};
