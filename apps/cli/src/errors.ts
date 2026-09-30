import { ORPCError } from "@orpc/client";

export class CliStepError extends Error {
  constructor(
    readonly step: string,
    cause: unknown,
  ) {
    super(`failed while ${step}`, { cause });
    this.name = "CliStepError";
  }
}

export const runStep = async <T>(step: string, run: () => Promise<T>): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    throw new CliStepError(step, error);
  }
};

const MAX_CAUSE_DEPTH = 5;

export const describeError = (error: unknown): string => {
  const parts: string[] = [];
  let current: unknown = error;

  while (current instanceof Error && parts.length < MAX_CAUSE_DEPTH) {
    const code = (current as { code?: unknown }).code;
    parts.push(
      typeof code === "string" && !current.message.includes(code)
        ? `${current.message} (${code})`
        : current.message,
    );
    current = current.cause;
  }

  return parts.length > 0 ? parts.join(": ") : String(error);
};

const isNetworkError = (error: unknown): boolean =>
  error instanceof TypeError && error.message === "fetch failed";

export const formatCliError = (error: unknown, serverUrl: string): string => {
  if (error instanceof CliStepError) {
    return `Failed while ${error.step}: ${formatCliError(error.cause, serverUrl)}`;
  }

  if (error instanceof ORPCError) {
    return `Request to ${serverUrl} failed: ${error.status} ${error.code} - ${error.message}`;
  }

  if (isNetworkError(error)) {
    return `Could not reach ${serverUrl}: ${describeError(error)}`;
  }

  return describeError(error);
};
