import type {
  GetHistoryOutputSchema,
  SnapshotHistoryEntrySchema,
} from "@ovr/api/contracts/snapshots";

import { formatTable } from "../../table";
import { SHORT_COMMIT_LENGTH } from "../builds/table";
import { formatDiffPercent } from "./table";

const HEADERS = ["SNAPSHOT", "BUILD", "COMMIT", "CREATED", "STATUS", "DIFF%", "IMAGE"];

const ALPHABET_SIZE = 26;

const formatImageLabel = (index: number): string => {
  const letter = String.fromCharCode(65 + (index % ALPHABET_SIZE));
  const rest = Math.floor(index / ALPHABET_SIZE);

  return rest === 0 ? letter : `${formatImageLabel(rest - 1)}${letter}`;
};

export const getImageLabels = (snapshots: SnapshotHistoryEntrySchema[]): Map<string, string> => {
  const labels = new Map<string, string>();

  for (const { variantId } of [...snapshots].reverse()) {
    if (variantId && !labels.has(variantId)) {
      labels.set(variantId, formatImageLabel(labels.size));
    }
  }

  return labels;
};

export const countImageChanges = (snapshots: SnapshotHistoryEntrySchema[]): number => {
  const images = snapshots
    .map(({ variantId }) => variantId)
    .filter((variantId) => variantId !== null);

  return images.filter((variantId, index) => index > 0 && variantId !== images[index - 1]).length;
};

const formatTimes = (count: number): string => (count === 1 ? "1 time" : `${count} times`);

export const formatHistorySummary = ({ branch, snapshots }: GetHistoryOutputSchema): string => {
  const images = getImageLabels(snapshots).size;

  return `Screenshot changed ${formatTimes(countImageChanges(snapshots))} across the last ${snapshots.length} builds on ${branch} (${images} distinct ${images === 1 ? "image" : "images"}).`;
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

  const labels = getImageLabels(history.snapshots);
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
