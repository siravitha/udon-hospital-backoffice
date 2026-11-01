// ============================================================================
// Engine 3 — 3-Way Match + Tax Engine (canonical formulas)
//
//   Ex-VAT      = Incl-VAT × 100 / 107
//   WHT         = 1% × Ex-VAT           (0 for GPO / หน่วยงานรัฐ)
//   Net Payable = Incl-VAT − WHT − Penalty
//
// SHARED FIXTURE (must hold in DB / Backend / Frontend / Security):
//   Incl-VAT  1,070,000.00
//   Ex-VAT    1,000,000.00
//   WHT        10,000.00
//   Penalty    50,000.00
//   Net        1,010,000.00
// ============================================================================
export interface ThreeWayInput {
  inclVat: number;
  vendorClass: "PRIVATE" | "GPO" | "GOV_AGENCY" | "RED_CROSS";
  penalty: number;
}

export interface ThreeWayResult {
  inclVat: number;
  exVat: number;
  vat: number;
  wht: number;
  whtExemptReason: string | null;
  penalty: number;
  netPayable: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeThreeWay(input: ThreeWayInput): ThreeWayResult {
  const inclVat = input.inclVat;
  const exVat = inclVat * 100 / 107;                 // canonical
  const vat = inclVat - exVat;

  let wht = 0;
  let whtExemptReason: string | null = null;
  if (input.vendorClass === "GPO") {
    wht = 0;
    whtExemptReason = "GPO_PRIVILEGED";
  } else if (input.vendorClass === "GOV_AGENCY" || input.vendorClass === "RED_CROSS") {
    wht = 0;
    whtExemptReason = "GOV_AGENCY";
  } else {
    wht = round2(exVat * 0.01);                       // WHT = 1% of Ex-VAT
  }

  const netPayable = round2(inclVat - wht - input.penalty);
  return { inclVat, exVat, vat, wht, whtExemptReason, penalty: input.penalty, netPayable };
}

// ---------------------------------------------------------------------------
// SHARED FIXTURE unit test (in-process; runs at module load in test env)
// ---------------------------------------------------------------------------
export function runSharedFixtureCheck(): void {
  const r = computeThreeWay({ inclVat: 1_070_000, vendorClass: "PRIVATE", penalty: 50_000 });
  if (r.exVat !== 1_000_000) throw new Error(`FIXTURE exVat ${r.exVat} !== 1,000,000.00`);
  if (r.wht !== 10_000) throw new Error(`FIXTURE wht ${r.wht} !== 10,000.00`);
  if (r.netPayable !== 1_010_000)
    throw new Error(`FIXTURE netPayable ${r.netPayable} !== 1,010,000.00`);
}

if (process.env.NODE_ENV === "test") {
  runSharedFixtureCheck();
}

// ---------------------------------------------------------------------------
// 3-way match guard: invoice (inclVat) must reconcile with PO + inspection
// ---------------------------------------------------------------------------
export function threeWayMatch(opts: {
  poAmount: number;
  invoiceInclVat: number;
  inspectionOk: boolean;
  tolerancePct?: number;
}): { ok: boolean; reason: string } {
  const tol = opts.tolerancePct ?? 0;
  if (!opts.inspectionOk) return { ok: false, reason: "Inspection not passed" };
  const diff = Math.abs(opts.poAmount - opts.invoiceInclVat);
  if (diff > (opts.poAmount * tol) / 100) {
    return { ok: false, reason: `Invoice/PO variance ${diff} exceeds tolerance ${tol}%` };
  }
  return { ok: true, reason: "OK" };
}
