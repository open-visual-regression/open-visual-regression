import { type BuildStatus } from "@ovr/api/contracts/builds";

import { describe, expect, it, render, screen } from "@/test-utils";

import { BuildStatusBadge } from "../BuildStatus";

const cases: [BuildStatus, string][] = [
  ["queued", "Queued"],
  ["processing", "Processing"],
  ["needs_review", "Needs review"],
  ["unchanged", "Unchanged"],
  ["auto_approved", "Auto approved"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["error", "Error"],
];

describe("BuildStatusBadge", () => {
  cases.forEach(([status, label]) => {
    it(`should label the ${status} status as "${label}"`, () => {
      render(<BuildStatusBadge status={status} />);

      expect(screen.getByText(label)).toBeVisible();
    });
  });
});
