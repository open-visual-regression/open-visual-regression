#!/usr/bin/env bash
# Usage: stress/run.sh <label> <mode> <concurrency...>
set -euo pipefail
cd "$(dirname "$0")/.."
label=$1 mode=$2; shift 2
for c in "$@"; do
  CONCURRENCY=$c SNAPSHOTS=${SNAPSHOTS:-600} MODE=$mode LABEL=$label \
    ../../apps/worker/node_modules/.bin/tsx stress/stress.ts | node -e '
      let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
        const j = JSON.parse(s.slice(s.indexOf("{")));
        console.log([j.label, "c" + j.concurrency, j.wallSeconds + "s", j.snapshotsPerHour + "/h",
          "p50", j.perSnapshotMs.p50, "p95", j.perSnapshotMs.p95, "mean", j.perSnapshotMs.mean,
          "shots", j.screenshotsPerSnapshot, "unstable", j.unstableSnapshots,
          JSON.stringify(j.phaseMeanMs), "nondet:", j.nondeterministicOutputs.join(", ")].join(" "));
      });'
done
