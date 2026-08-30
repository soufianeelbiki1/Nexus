import type { OperationalSnapshot, SnapshotLoadResult } from "./operations";
import { classifyFreshness } from "./operations";

export interface SnapshotSource {
  load(): Promise<OperationalSnapshot>;
}

export class FixtureSnapshotSource implements SnapshotSource {
  constructor(private readonly snapshot: OperationalSnapshot) {}

  async load(): Promise<OperationalSnapshot> {
    return structuredClone(this.snapshot);
  }
}

export async function loadOperationalSnapshot(
  source: SnapshotSource,
  *,
  now: Date,
  staleAfterSeconds = 90,
): Promise<SnapshotLoadResult> {
  try {
    const snapshot = await source.load();
    if (snapshot.missingSections.length > 0 || snapshot.dataState === "partial") {
      return {
        state: "partial",
        snapshot,
        missingSections: [...snapshot.missingSections],
      };
    }

    const freshness = classifyFreshness(snapshot.provenance.generatedAt, now, staleAfterSeconds);
    if (freshness === "unavailable") {
      return { state: "unavailable", reason: "snapshot generatedAt is invalid" };
    }
    if (freshness === "stale") {
      const generatedAt = new Date(snapshot.provenance.generatedAt).getTime();
      return {
        state: "stale",
        snapshot,
        ageSeconds: Math.max(0, Math.floor((now.getTime() - generatedAt) / 1000)),
      };
    }
    return { state: "ready", snapshot };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown snapshot source failure";
    return { state: "unavailable", reason };
  }
}
