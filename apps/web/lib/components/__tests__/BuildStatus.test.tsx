import { type BuildStatus } from "@ovr/api/contracts/builds";

import { describe, expect, it, render, screen } from "@/test-utils";

import { BuildStatusBadge } from "../BuildStatus";

const cases: [BuildStatus, string][] = [
  ["queued", "queued"],
  ["processing", "processing"],
  ["needs_review", "needs review"],
  ["passed", "passed"],
  ["approved", "approved"],
  ["rejected", "rejected"],
  ["error", "error"],
];

describe("BuildStatusBadge", () => {
  cases.forEach(([status, label]) => {
    it(`should label the ${status} status as "${label}"`, () => {
      render(<BuildStatusBadge status={status} />);

      expect(screen.getByText(label)).toBeVisible();
    });
  });
});
