export const register = async () => {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { assertEncryptionKey } = await import("@ovr/git-status/crypto");
  assertEncryptionKey();
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
};
