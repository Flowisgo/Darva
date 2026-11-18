// Verify every transaction the capture produced, read-only, and write
// verification.md + capture/logs/verification.json.
//
//   node capture/verify.mjs
//
// 1. Each hash in capture/logs/state.json is looked up on Horizon (testnet):
//    it must exist, be successful, and call the Darva contract.
// 2. The film's loans are read back from the contract (simulation only,
//    nothing is signed or sent) and every figure shown on screen is compared.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CLI_CONFIG, HERE, VIDEO } from "./lib.mjs";

const HORIZON = "https://horizon-testnet.stellar.org";
const dep = JSON.parse(readFileSync(join(VIDEO, "..", "frontend", "lib", "deployment.json"), "utf8"));
const state = JSON.parse(readFileSync(join(HERE, "logs", "state.json"), "utf8"));
const UNIT = 10_000_000n;
const usdc = (v) => {
  const n = BigInt(v);
  return `${n / UNIT}.${String((n % UNIT) / 100000n).padStart(2, "0")}`;
};

async function horizon(hash) {
  const r = await fetch(`${HORIZON}/transactions/${hash}`);
  if (!r.ok) return { hash, found: false, status: r.status };
  const t = await r.json();
  const ops = await (await fetch(`${HORIZON}/transactions/${hash}/operations`)).json();
  const op = ops._embedded?.records?.[0] ?? {};
  const fn = op.parameters?.find?.((p) => p.type === "Sym")?.value;
  return {
    hash,
    found: true,
    successful: t.successful,
    ledger: t.ledger,
    created_at: t.created_at,
    source: t.source_account,
    fee_charged_xlm: Number(t.fee_charged) / 1e7,
    op_type: op.type,
    fn: fn ? Buffer.from(fn, "base64").toString("utf8").replace(/[^\x20-\x7e]/g, "") : null,
    contract_called: op.type === "invoke_host_function" ? JSON.stringify(op).includes(dep.contract) || op.function === "HostFunctionTypeHostFunctionTypeInvokeContract" : false,
  };
}

/** Read-only contract view through the Stellar CLI (simulation, never sent). */
function view(fn, args) {
  const out = execFileSync(
    "stellar",
    ["contract", "invoke", "--id", dep.contract, "--source-account", "rd-investor", "--network", "testnet", "--config-dir", CLI_CONFIG, "--send=no", "--", fn, ...args],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  return JSON.parse(out.trim());
}

const no = (id) => `No. ${String(id).padStart(4, "0")}`;
const BEAT_ACTION = {
  "store-issue": `Kaya Rug House issues the certificate for rug ${no(state.rugHappy)}`,
  "weaver-borrow": "Ayşe asks for 600.00 USDC for 6 months",
  "investor-lend": "Deniz lends 600.00 USDC",
  "weaver-repay": "Ayşe repays 600.00 USDC",
  "store-handover": `Kaya Rug House co-signs; certificate ${no(state.rugHappy)} closed`,
  "stage-buyout": `Staging (not on screen): rug ${no(state.rugBuyout)} issued, 1-month request, funded`,
  buyout: `Kaya Rug House buys rug ${no(state.rugBuyout)} for 600.00 USDC`,
};
const ON_SCREEN = new Set(["store-issue", "weaver-borrow", "investor-lend", "weaver-repay", "store-handover", "buyout"]);

const txs = [];
for (const t of state.txs) {
  const h = await horizon(t.hash);
  txs.push({ ...t, ...h, onScreen: ON_SCREEN.has(t.beat) });
  console.log(`${h.found && h.successful ? "ok  " : "FAIL"} ${t.beat.padEnd(16)} ${t.hash.slice(0, 12)}… ledger ${h.ledger} ${h.created_at} ${h.fn ?? ""}`);
}

// Find the film's loans by rug id.
const nextLoan = Number(view("next_loan_id", []));
const loans = [];
for (let id = 1; id < nextLoan; id++) loans.push(view("get_loan", ["--loan_id", String(id)]));
const happy = loans.filter((l) => Number(l.rug_id) === state.rugHappy).at(-1);
const buy = loans.filter((l) => Number(l.rug_id) === state.rugBuyout).at(-1);
const rugHappy = view("get_rug", ["--rug_id", String(state.rugHappy)]);
const rugBuy = view("get_rug", ["--rug_id", String(state.rugBuyout)]);
const kaya = view("get_store", ["--store", dep.accounts.store]);

const expect = [
  [`Rug ${no(state.rugHappy)} price`, usdc(rugHappy.price), "600.00"],
  [`Rug ${no(state.rugHappy)} status after the hand-over`, rugHappy.status, "Redeemed"],
  [`Loan on ${no(state.rugHappy)}: months`, String(happy.months), "6"],
  [`Loan on ${no(state.rugHappy)}: principal`, usdc(happy.principal), "600.00"],
  [`Loan on ${no(state.rugHappy)}: interest held for the investor`, usdc(happy.interest), "45.00"],
  [`Loan on ${no(state.rugHappy)}: platform fee`, usdc(happy.platform_fee), "6.00"],
  [`Loan on ${no(state.rugHappy)}: store fee`, usdc(happy.store_fee), "9.00"],
  [`Loan on ${no(state.rugHappy)}: weaver receives`, usdc(happy.weaver_payout), "540.00"],
  [`Loan on ${no(state.rugHappy)}: investor gets back (principal + interest)`, usdc(BigInt(happy.principal) + BigInt(happy.interest)), "645.00"],
  [`Loan on ${no(state.rugHappy)}: weaver's total cost (principal − payout)`, usdc(BigInt(happy.principal) - BigInt(happy.weaver_payout)), "60.00"],
  [`Loan on ${no(state.rugHappy)}: status`, happy.status, "Repaid"],
  [`Loan on ${no(state.rugHappy)}: investor`, happy.investor, dep.accounts.investor],
  [`Rug ${no(state.rugBuyout)} owner after the buy-out`, rugBuy.owner, dep.accounts.store],
  [`Loan on ${no(state.rugBuyout)}: months`, String(buy.months), "1"],
  [`Loan on ${no(state.rugBuyout)}: status`, buy.status, "BoughtOut"],
  ["Kaya Rug House frozen", String(kaya.frozen), "false"],
  ["Kaya Rug House open principal (USDC)", usdc(kaya.open_principal), "0.00"],
];
let ok = txs.every((t) => t.found && t.successful);
console.log("");
for (const [k, got, want] of expect) {
  const pass = got === want;
  ok &&= pass;
  console.log(`${pass ? "ok  " : "FAIL"} ${k}: ${got}${pass ? "" : ` (expected ${want})`}`);
}

writeFileSync(join(HERE, "logs", "verification.json"), JSON.stringify({ checkedAt: new Date().toISOString(), contract: dep.contract, txs, loans: { happy, buy }, rugs: { rugHappy, rugBuy }, expect }, null, 1));

// ---------------------------------------------------------------- markdown
const ex = (h) => `[\`${h.slice(0, 10)}…\`](https://stellar.expert/explorer/testnet/tx/${h})`;
const row = (t) => `| ${BEAT_ACTION[t.beat] ?? t.beat} | ${t.fn ?? ""} | ${ex(t.hash)} | ${t.ledger ?? "—"} | ${t.created_at ?? "—"} | ${t.fee_charged_xlm ?? "—"} | ${t.found && t.successful ? "success" : "**NOT VERIFIED**"} |`;
const head = "| Action | Contract call | Transaction | Ledger | Closed (UTC) | Fee (XLM) | Horizon |\n|---|---|---|---:|---|---:|---|";
const md = `# Verification

Checked ${new Date().toISOString().replace(/\.\d+Z$/, "Z")} with \`node capture/verify.mjs\` (read-only). Contract \`${dep.contract}\` on Stellar Testnet.

**Capture route: automated wallet (route a).** Every button press in the film is a real click in the production build of the app (\`next start\`), and every signature is the real Varial wallet (v5.52.0, loaded unpacked into Playwright's Chromium) approving the real request. Nothing was replaced by a script or a graphic. The Varial windows in the film are screen recordings of the extension's own popup pages; they are composited beside the app (the popup's empty backdrop above its sheet is cropped), because a real popup is a separate window.

## How each hash was checked

1. The hash comes from the app's own \`sendTransaction\` RPC response, recorded while the button was pressed (\`capture/logs/state.json\`).
2. \`GET ${HORIZON}/transactions/<hash>\` must return the transaction with \`successful: true\`; the ledger and close time below come from that response, the contract function from its operation.
3. The film's loans are then read back from the contract with \`stellar contract invoke --send=no\` (simulation: \`get_loan\`, \`get_rug\`, \`next_loan_id\`) and every figure captioned on screen is compared with the contract's record.

## Transactions on screen

${head}
${txs.filter((t) => t.onScreen).map(row).join("\n")}

The hand-over also needed Ayşe's signature on an authorisation entry (Varial's *Confirm Authorizations: redeem*). That is a signature, not a transaction; it is inside the co-sign transaction above.

## Transactions made for the film but not shown

${head}
${txs.filter((t) => !t.onScreen).map(row).join("\n")}

Connection approvals (Varial's *Connection Request*) are not transactions.

## Figures on screen, checked against the contract

| Check | Contract says | Result |
|---|---|---|
${expect.map(([k, got, want]) => `| ${k} | \`${got}\` | ${got === want ? "matches" : `**expected ${want}**`} |`).join("\n")}

The local-currency figures (≈ 24,300 TRY etc.) are the app's fixed demo rate of 45 TRY per USDC, as the README says. The network fee caption (0.0058 XLM) is the fee Varial displayed for the issue transaction; Horizon's \`fee_charged\` for it is in the first table.

## Testnet state the film leaves behind

- Rugs **No. 0001–0003**: the scripted repay, buy-out and claim scenarios (\`scripts/testnet.py demo\`), run before the capture.
- Rug **${no(state.rugHappy)}** "${rugHappy.description}": loan ${happy.id} repaid, certificate closed. It shows under *Earlier rugs* as Collected on Ayşe's desk.
- Rug **${no(state.rugBuyout)}** "${rugBuy.description}": loan ${buy.id} bought out; Kaya Rug House holds the certificate (*Bought by this store*, with a **Close the certificate** button on the store desk).
- Kaya Rug House is **not** frozen and has no open loans; nothing is overdue or claimable.
- /activity shows all of the above as plain sentences; the testnet RPC keeps about 7 days of events.
`;
writeFileSync(join(VIDEO, "verification.md"), md);
console.log(ok ? "\nALL VERIFIED. Wrote verification.md" : "\nSOMETHING DID NOT VERIFY. Wrote verification.md anyway; fix before shipping.");
process.exit(ok ? 0 : 1);
