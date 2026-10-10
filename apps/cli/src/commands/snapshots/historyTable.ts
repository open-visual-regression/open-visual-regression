import type {
  GetHistoryOutputSchema,
  SnapshotHistoryEntrySchema,
} from "@ovr/api/contracts/snapshots";

import { formatTable } from "../../table";
import { SHORT_COMMIT_LENGTH } from "../builds/table";
import { formatDiffPercent } from "./table";

const HEADERS = ["SNAPSHOT", "BUILD", "COMMIT", "CREATED", "STATUS", "DIFF%", "LOOK"];

const ALPHABET_SIZE = 26;

const formatLookLabel = (index: number): string => {
  const letter = String.fromCharCode(65 + (index % ALPHABET_SIZE));
  const rest = Math.floor(index / ALPHABET_SIZE);

  return rest === 0 ? letter : `${formatLookLabel(rest - 1)}${letter}`;
};

export const getLookLabels = (snapshots: SnapshotHistoryEntrySchema[]): Map<string, string> => {
  const labels = new Map<string, string>();

  for (const { variantId } of [...snapshots].reverse()) {
    if (variantId && !labels.has(variantId)) {
      labels.set(variantId, formatLookLabel(labels.size));
    }
  }

  return labels;
};

export const countLookChanges = (snapshots: SnapshotHistoryEntrySchema[]): number => {
  const looks = snapshots
    .map(({ variantId }) => variantId)
    .filter((variantId) => variantId !== null);

  return looks.filter((variantId, index) => index > 0 && variantId !== looks[index - 1]).length;
};

const formatTimes = (count: number): string => (count === 1 ? "1 time" : `${count} times`);

export const formatHistorySummary = ({ branch, snapshots }: GetHistoryOutputSchema): string => {
  const looks = getLookLabels(snapshots).size;

  return `Screenshot changed ${formatTimes(countLookChanges(snapshots))} across the last ${snapshots.length} builds on ${branch} (${looks} different ${looks === 1 ? "look" : "looks"}).`;
};

export const formatHistoryOutput = (
  history: GetHistoryOutputSchema,
  json: boolean | undefined,
): string => {
  if (json) {
    return JSON.stringify(history, null, 2);
  }

  if (history.snapshots.length === 0) {
    return `No snapshots like this one on ${history.branch}.`;
  }

  const labels = getLookLabels(history.snapshots);
  const table = formatTable(
    HEADERS,
    history.snapshots.map((snapshot) => [
      snapshot.id,
      snapshot.buildId,
      snapshot.commitSha.slice(0, SHORT_COMMIT_LENGTH),
      snapshot.createdAt,
      snapshot.status,
      formatDiffPercent(snapshot.diffPercent),
      (snapshot.variantId && labels.get(snapshot.variantId)) ?? "-",
    ]),
  );

  return `${table}\n\n${formatHistorySummary(history)}`;
};
