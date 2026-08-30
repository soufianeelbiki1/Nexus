import assert from "node:assert/strict";
import test from "node:test";

import { atlasPayFixture } from "../data/atlaspay-snapshot";
import {
  buildOperatorChecks,
  filterTransactions,
} from "../lib/operator-workflows";

test("transaction search matches issuer STAN RRN and reversal correlation", () => {
  assert.deepEqual(
    filterTransactions(atlasPayFixture.networkTransactions, { query: "issuer-bank-b" }).map(
      (item) => item.id,
    ),
    ["txn-fixture-002", "txn-fixture-003"],
  );
  assert.deepEqual(
    filterTransactions(atlasPayFixture.networkTransactions, { query: "734567" }).map(
      (item) => item.id,
    ),
    ["txn-fixture-002"],
  );
});

test("transaction filter combines query and disposition", () => {
  const results = filterTransactions(atlasPayFixture.networkTransactions, {
    query: "issuer-bank-b",
    disposition: "late",
  });

  assert.deepEqual(results.map((item) => item.id), ["txn-fixture-003"]);
});

test("operator checks preserve read-only reconciliation semantics", () => {
  const checks = buildOperatorChecks(atlasPayFixture);
  const ledger = checks.find((check) => check.id === "ledger-reconciliation");
  const outbox = checks.find((check) => check.id === "outbox-delivery");

  assert.equal(ledger?.severity, "ok");
  assert.equal(outbox?.severity, "critical");
  assert.match(outbox?.operatorAction ?? "", /do not discard poison events/);
});

test("ledger discrepancies are critical and never auto-repaired", () => {
  const snapshot = structuredClone(atlasPayFixture);
  snapshot.ledger.balanced = false;
  snapshot.ledger.discrepancies = 3;

  const ledger = buildOperatorChecks(snapshot).find(
    (check) => check.id === "ledger-reconciliation",
  );

  assert.equal(ledger?.severity, "critical");
  assert.match(
    ledger?.operatorAction ?? "",
    /do not mutate accounting history automatically/,
  );
});
