export type Result<TData, TError = string> =
  | { status: "ok"; data: TData | null }
  | { status: "error"; error: TError };
