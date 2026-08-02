import { describe, expect, it } from "@/test-utils";

import { getSkeletonGridItems } from "../getSkeletonGridItems";

const PROJECT_CARD_TIERS = [
  { columns: 1, className: "" },
  { columns: 2, className: "hidden md:block" },
  { columns: 3, className: "hidden lg:block" },
];

const SNAPSHOT_TIERS = [
  { columns: 2, className: "" },
  { columns: 3, className: "hidden md:block" },
  { columns: 4, className: "hidden lg:block" },
  { columns: 5, className: "hidden xl:block" },
];

const visibleAt = (tiers: { columns: number; className: string }[], tierIndex: number) =>
  getSkeletonGridItems(tiers).filter(({ className }) =>
    tiers.slice(0, tierIndex + 1).some((tier) => tier.className === className),
  ).length;

describe("getSkeletonGridItems", () => {
  it("should fill every row of the project card grid at each breakpoint", () => {
    PROJECT_CARD_TIERS.forEach((tier, index) => {
      expect(visibleAt(PROJECT_CARD_TIERS, index) % tier.columns).toBe(0);
    });
  });

  it("should fill every row of the snapshot grid at each breakpoint", () => {
    SNAPSHOT_TIERS.forEach((tier, index) => {
      expect(visibleAt(SNAPSHOT_TIERS, index) % tier.columns).toBe(0);
    });
  });

  it("should render the same number of rows at every breakpoint", () => {
    const rowCounts = SNAPSHOT_TIERS.map(
      (tier, index) => visibleAt(SNAPSHOT_TIERS, index) / tier.columns,
    );

    expect(new Set(rowCounts).size).toBe(1);
  });

  it("should give every item a unique key", () => {
    const items = getSkeletonGridItems(SNAPSHOT_TIERS);

    expect(new Set(items.map(({ key }) => key)).size).toBe(items.length);
  });
});
