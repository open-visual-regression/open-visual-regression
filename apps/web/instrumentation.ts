export const register = async () => {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { assertEncryptionKey } = await import("@ovr/git-status/crypto");
  assertEncryptionKey();

  const { assertAuthConfig } = await import("@/lib/auth/config");
  assertAuthConfig();

  const { startMetrics } = await import("@ovr/metrics/server");
  const { APP_VERSION } = await import("@/lib/utils/version");
  if (await startMetrics({ serviceName: "ovr-web", serviceVersion: APP_VERSION })) {
    const { observeBuildsInProgress, observeQueues } = await import("@/lib/metrics");
    observeQueues();
    observeBuildsInProgress();
  }
};

export const onRequestError = async (
  error: unknown,
  request: Readonly<{ path: string; method: string; headers: NodeJS.Dict<string | string[]> }>,
  context: Readonly<{ routerKind: string; routePath: string; routeType: string }>,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { createLogger } = await import("@ovr/logger");
  const logger = createLogger("request");

  logger.error(
    {
      err: error,
      path: request.path,
      method: request.method,
      routeType: context.routeType,
      routePath: context.routePath,
    },
    "unhandled request error",
  );

  const { requestErrors } = await import("@/lib/metrics");
  requestErrors.add(1, { route_type: context.routeType });
};
