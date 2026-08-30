import assert from "node:assert/strict";
import test from "node:test";

import { atlasPayFixture } from "../data/atlaspay-snapshot";
import { parseOperationalSnapshot, SnapshotContractError } from "../lib/snapshot-schema";

test("fixture satisfies the runtime snapshot contract", () => {
  assert.deepEqual(parseOperationalSnapshot(atlasPayFixture), atlasPayFixture);
});

test("invalid authorization counters fail closed", () => {
  const broken = structuredClone(atlasPayFixture) as unknown as Record<string, unknown>;
  const authorizations = broken.authorizations as Record<string, unknown>;
  authorizations.total = -1;

  assert.throws(() => parseOperationalSnapshot(broken), SnapshotContractError);
});

test("partial reversal correlation is rejected", () => {
  const broken = structuredClone(atlasPayFixture);
  broken.networkTransactions[0] = {
    ...broken.networkTransactions[0],
    reversalReason: "timeout",
    reversalStan: "999999",
    reversalRrn: null,
  };

  assert.throws(
    () => parseOperationalSnapshot(broken),
    /reversal fields must be present together/,
  );
});

test("unknown contract versions are rejected", () => {
  const broken = structuredClone(atlasPayFixture) as unknown as {
    provenance: { contractVersion: string };
  };
  broken.provenance.contractVersion = "v2";

  assert.throws(() => parseOperationalSnapshot(broken), /unsupported value/);
});
