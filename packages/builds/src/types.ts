export type Result<TData, TError = string> =
  | { status: "ok"; data: TData }
  | { status: "error"; error: TError };
