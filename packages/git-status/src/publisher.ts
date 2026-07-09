import type {
  BuildProcessingStatus,
  BuildReviewStatus,
  GitProvider,
  GitStatusState,
} from "@ovr/db/schema";

export type { GitStatusState };

export type BuildStatusInput = {
  processingStatus: BuildProcessingStatus;
  reviewStatus: BuildReviewStatus;
};

export type MappedStatus = {
  state: GitStatusState;
  description: string;
};

export const mapBuildStatus = ({
  processingStatus,
  reviewStatus,
}: BuildStatusInput): MappedStatus => {
  if (processingStatus === "queued" || processingStatus === "processing") {
    return { state: "pending", description: "analyzing visual changes" };
  }

  if (processingStatus === "error") {
    return { state: "error", description: "build failed to process" };
  }

  if (processingStatus === "canceled") {
    return { state: "failure", description: "build canceled" };
  }

  switch (reviewStatus) {
    case "needs_review":
      return { state: "failure", description: "visual changes need review" };
    case "rejected":
      return { state: "failure", description: "visual changes rejected" };
    case "approved":
      return { state: "success", description: "visual changes approved" };
    case "auto_approved":
      return { state: "success", description: "changes within threshold" };
    case "unchanged":
    case "not_required":
      return { state: "success", description: "no visual changes" };
  }
};

export type AdapterConfig = {
  provider: GitProvider;
  baseUrl: string | null;
  repoIdentifier: string;
  token: string;
};

export type PublishRequest = {
  sha: string;
  state: GitStatusState;
  context: string;
  description: string;
  targetUrl: string;
};

export type HttpRequest = {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

export type VerifyRequest = {
  url: string;
  headers: Record<string, string>;
};

export type Adapter = {
  buildRequest: (config: AdapterConfig, request: PublishRequest) => HttpRequest;
  buildVerifyRequest: (config: AdapterConfig) => VerifyRequest;
};

export type PublishOutcome = {
  outcome: "ok" | "error";
  httpStatus?: number;
  error?: string;
  retryable: boolean;
};

const TERMINAL_STATUSES = new Set([400, 401, 403, 404, 422]);

export type VerifyOutcome = {
  ok: boolean;
  httpStatus: number | null;
  error: string | null;
};

export const verify = async (request: VerifyRequest): Promise<VerifyOutcome> => {
  try {
    const response = await fetch(request.url, { method: "GET", headers: request.headers });
    if (response.ok) {
      return { ok: true, httpStatus: response.status, error: null };
    }
    return {
      ok: false,
      httpStatus: response.status,
      error: `provider responded with ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      httpStatus: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const send = async (request: HttpRequest): Promise<PublishOutcome> => {
  try {
    const response = await fetch(request.url, {
      method: "POST",
      headers: { "content-type": "application/json", ...request.headers },
      body: JSON.stringify(request.body),
    });

    if (response.ok) {
      return { outcome: "ok", httpStatus: response.status, retryable: false };
    }

    return {
      outcome: "error",
      httpStatus: response.status,
      error: `provider responded with ${response.status}`,
      retryable: !TERMINAL_STATUSES.has(response.status),
    };
  } catch (error) {
    return {
      outcome: "error",
      error: error instanceof Error ? error.message : String(error),
      retryable: true,
    };
  }
};
