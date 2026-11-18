// Re-record test/testnet-events.json from the deployed contract's real events:
// the first event of each kind the demo scenarios produced, as raw XDR.
//
//   node scripts/record-event-fixtures.mjs     (after `npm run sync-deployment`)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { rpc, scValToNative } from "@stellar/stellar-sdk";

const ROOT = join(import.meta.dirname, "..");
const dep = JSON.parse(readFileSync(join(ROOT, "lib", "deployment.json"), "utf8"));
const KINDS = ["store_registered", "rug_minted", "loan_requested", "loan_funded", "loan_repaid", "store_bought_out", "store_frozen", "rug_claimed"];

const server = new rpc.Server("https://soroban-testnet.stellar.org");
const out = {};
let cursor;
for (let page = 0; page < 50 && Object.keys(out).length < KINDS.length; page++) {
  const req = { filters: [{ type: "contract", contractIds: [dep.contract] }], limit: 100 };
  const res = await server.getEvents(cursor ? { ...req, cursor } : { ...req, startLedger: dep.deployLedger });
  for (const e of res.events) {
    const kind = String(scValToNative(e.topic[0]));
    if (!KINDS.includes(kind) || out[kind]) continue;
    out[kind] = {
      topic: e.topic.map((t) => t.toXDR("base64")),
      value: e.value.toXDR("base64"),
      ledger: e.ledger,
      at: e.ledgerClosedAt,
      txHash: e.txHash,
      id: e.id,
    };
  }
  if (!res.events.length) break;
  cursor = res.cursor;
}
const missing = KINDS.filter((k) => !out[k]);
if (missing.length) throw new Error(`no ${missing.join(", ")} event yet; run the demo scenarios first`);
writeFileSync(join(ROOT, "test", "testnet-events.json"), JSON.stringify(Object.fromEntries(KINDS.map((k) => [k, out[k]])), null, 2) + "\n");
console.log(`wrote test/testnet-events.json (${KINDS.length} events from ${dep.contract})`);
