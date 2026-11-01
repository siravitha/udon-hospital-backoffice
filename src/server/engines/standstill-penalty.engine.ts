// ============================================================================
// Engine 1 — Holiday-Aware Standstill & Penalty
// · Standstill: 7 working days from award, gov_holiday_calendar aware
// · Penalty: 0.5%/day of contract value, inspection_days deducted (Statutory)
// · Hard ceiling 10% → PENALTY_CAPPED, legal review required
// · PO block: standstill_open = TRUE → POST /api/contracts/call-off → 423
// ============================================================================
import { pool } from "../lib/pool";
import { PENALTY_DAILY_RATE, PENALTY_CAP, STANDSTILL_WORKING_DAYS } from "../lib/pool";

export class StandstillActiveError extends Error {
  readonly code = "STANDSTILL_ACTIVE" as const;
  readonly httpStatus = 423; // Locked
  constructor(public dueDate: Date) {
    super(`Contract in ${STANDSTILL_WORKING_DAYS}-working-day standstill until ${dueDate.toISOString()}`);
  }
}

export interface WorkingDayCalendar {
  isWorkingDay(d: Date): boolean;
}

export class GovHolidayCalendar implements WorkingDayCalendar {
  private cache = new Map<string, boolean>();
  private holidaySet = new Set<string>();
  private loaded = false;

  async load(): Promise<this> {
    if (this.loaded) return this;
    const { rows } = await pool.query(`SELECT holiday_date FROM gov_holiday_calendar`);
    for (const r of rows) this.holidaySet.add(r.holiday_date.toISOString().slice(0, 10));
    this.loaded = true;
    return this;
  }

  isWorkingDay(d: Date): boolean {
    const key = d.toISOString().slice(0, 10);
    const hit = this.cache.get(key);
    if (hit !== undefined) return hit;
    const dow = d.getDay();
    const v = dow !== 0 && dow !== 6 && !this.holidaySet.has(key);
    this.cache.set(key, v);
    return v;
  }
}

/** Count working days in [from, to) using the government holiday calendar. */
export function countWorkingDays(cal: WorkingDayCalendar, from: Date, to: Date): number {
  let n = 0;
  const d = new Date(from);
  while (d.getTime() < to.getTime()) {
    if (cal.isWorkingDay(d)) n++;
    d.setDate(d.getDate() + 1);
  }
  return n;
}

/**
 * Advance a start date by `n` working days.
 */
export function addWorkingDays(cal: WorkingDayCalendar, from: Date, n: number): Date {
  const out = new Date(from);
  let remaining = n;
  while (remaining > 0) {
    out.setDate(out.getDate() + 1);
    if (cal.isWorkingDay(out)) remaining--;
  }
  return out;
}

export interface PenaltyComputation {
  penaltyDays: number;       // elapsed_working_days_after_due − committee_inspection_days
  penaltyAmount: number;     // contract_value × 0.5% × days
  capped: boolean;           // ceiling 10% hit
  state: "OK" | "PENALTY_CAPPED";
}

/**
 * Canonical penalty math — deterministic, unit-testable.
 * `inspectionDays` = days the committee spent inspecting (statutory exception:
 * clock pauses while inspection is in progress).
 */
export function computePenalty(opts: {
  contractValue: number;
  dueDate: Date;
  now: Date;
  elapsedWorkingDays: number;     // working days after dueDate
  inspectionDays: number;         // committee inspection days
  dailyRate?: number;
  cap?: number;
}): PenaltyComputation {
  const { contractValue, elapsedWorkingDays, inspectionDays } = opts;
  const rate = opts.dailyRate ?? PENALTY_DAILY_RATE;
  const cap = opts.cap ?? PENALTY_CAP;

  const netDays = Math.max(0, elapsedWorkingDays - inspectionDays);
  const raw = contractValue * rate * netDays;
  const maxAllowed = contractValue * cap;
  const capped = raw > maxAllowed;
  const amount = Math.min(raw, maxAllowed);

  return {
    penaltyDays: netDays,
    penaltyAmount: Math.round(amount * 100) / 100,
    capped,
    state: capped ? "PENALTY_CAPPED" : "OK",
  };
}

/** Guard used by POST /api/contracts/call-off before any PO creation. */
export async function assertStandstillClosed(contractId: string, now = new Date()) {
  const { rows } = await pool.query(
    `SELECT standstill_open, standstill_due, penalty_days, penalty_amount
       FROM contracts_and_calloff_pos WHERE contract_id = $1`,
    [contractId],
  );
  const c = rows[0];
  if (!c) throw new Error("Contract not found");
  if (c.standstill_open && (!c.standstill_due || c.standstill_due > now)) {
    throw new StandstillActiveError(new Date(c.standstill_due));
  }
  return c;
}

/**
 * Open standstill for a new award: due = addWorkingDays(award, 7).
 * Sets standstill_open = TRUE so call-offs return 423.
 */
export async function openStandstill(contractId: string, awardDate: Date, calendar: WorkingDayCalendar) {
  const due = addWorkingDays(calendar, awardDate, STANDSTILL_WORKING_DAYS);
  const { rowCount } = await pool.query(
    `UPDATE contracts_and_calloff_pos
        SET standstill_open = TRUE, standstill_due = $2,
            state = CASE WHEN state = 'AWARDED' THEN 'IN_STANDSTILL' ELSE state END,
            version = version + 1
      WHERE contract_id = $1`,
    [contractId, due],
  );
  if (rowCount !== 1) throw new Error("Failed to open standstill");
  return due;
}

/** Close standstill after the due date has passed. */
export async function closeStandstill(contractId: string) {
  await pool.query(
    `UPDATE contracts_and_calloff_pos
        SET standstill_open = FALSE, version = version + 1
      WHERE contract_id = $1`,
    [contractId],
  );
}
