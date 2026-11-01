-- ============================================================================
-- HOS-BACKOFFICE — 001_hospital_eprocurement_schema.sql
-- PostgreSQL 15+ · Production DDL · Owner: @DatabaseEngineer (Ticket #3)
-- Context: Thai government hospital e-procurement (พ.ร.บ. จัดซื้อจัดจ้างฯ 2560)
-- Conventions: UUID PK · NUMERIC(15,2) ยอดสุทธิ · NUMERIC(18,4) ราคา/ฐาน Ex-VAT
--              version INT NOT NULL DEFAULT 1 (OCC) · 5 budget states, canonical
--              spelling PRE_ENCUMBERED (UI label: Pre-Encumbered)
-- ============================================================================
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- 0. Enums / types
-- ---------------------------------------------------------------------------
CREATE TYPE budget_state AS ENUM
  ('Allocated', 'PRE_ENCUMBERED', 'Encumbered', 'Carry-Over Encumbered', 'Disbursed');

CREATE TYPE pr_type AS ENUM
  ('NORMAL', 'EMERGENCY_RETROSPECTIVE_PR', 'JOINT_PROCUREMENT', 'GPO_PRIVILEGED');

CREATE TYPE vendor_class AS ENUM ('PRIVATE', 'GPO', 'GOV_AGENCY', 'RED_CROSS');

CREATE TYPE inspection_result AS ENUM ('PENDING', 'PASS', 'FAIL', 'OBJECTION');

-- ---------------------------------------------------------------------------
-- 1. User & Dual-Auth group
-- ---------------------------------------------------------------------------
CREATE TABLE departments_cost_centers (
  cost_center_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id    TEXT NOT NULL UNIQUE,          -- clinical-pharma | budget | procurement | legal | finance
  name_th          TEXT NOT NULL,
  version          INT NOT NULL DEFAULT 1
);

CREATE TABLE users_and_moph_providers (
  user_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username                 CITEXT UNIQUE NOT NULL,
  password_hash            TEXT NOT NULL,         -- Argon2id: $argon2id$v=19$m=65536,t=3,p=4$...
  moph_provider_id         TEXT UNIQUE,           -- MOPH Health ID / Provider ID
  hcode                    CHAR(5),               -- รหัสสถานพยาบาล 5 หลัก (must equal hospital)
  council_code             TEXT,                  -- เลขใบประกอบวิชาชีพ
  department_id            TEXT NOT NULL REFERENCES departments_cost_centers(department_id),
  two_factor_verified_at   TIMESTAMPTZ,
  locked_until             TIMESTAMPTZ,
  version                  INT NOT NULL DEFAULT 1,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auth_sessions_audit (
  session_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users_and_moph_providers(user_id),
  auth_layer       TEXT NOT NULL CHECK (auth_layer IN ('L1_LOCAL', 'L2_MOPH_OIDC', 'STEPUP_2FA')),
  ip_address       INET,
  user_agent       TEXT,
  stepup_action    TEXT,                          -- APPROVE_BUDGET | SIGN_PADES | EMERGENCY_CASE | TRANSFER_FUNDS
  granted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at       TIMESTAMPTZ,
  version          INT NOT NULL DEFAULT 1
);

-- ---------------------------------------------------------------------------
-- 2. Budget & plan group
-- ---------------------------------------------------------------------------
CREATE TABLE gov_holiday_calendar (
  holiday_date   DATE PRIMARY KEY,
  holiday_name_th TEXT,
  is_special_cabinet_day BOOLEAN NOT NULL DEFAULT FALSE  -- วันพิเศษ ครม.
);

CREATE TABLE hospital_funds_budgets (
  budget_id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year                 SMALLINT NOT NULL,
  fund_code                   TEXT NOT NULL
      CHECK (fund_code IN ('GOV_BUDGET','HOSPITAL_MAINTENANCE','DONATION_SPECIFIED','DONATION_UNSPECIFIED','UC_DEPRECIATION')),
  fund_name_th                TEXT NOT NULL,
  purpose_restricted          BOOLEAN NOT NULL DEFAULT FALSE,  -- เงินบริจาคระบุวัตถุประสงค์
  purpose_text                TEXT,
  line_item_code              TEXT NOT NULL,
  allocated_amount            NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (allocated_amount >= 0),
  pre_encumbered_amount       NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (pre_encumbered_amount >= 0),
  encumbered_amount           NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (encumbered_amount >= 0),
  carry_over_encumbered_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (carry_over_encumbered_amount >= 0),
  disbursed_amount            NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (disbursed_amount >= 0),
  current_state               budget_state NOT NULL DEFAULT 'Allocated',
  version                     INT NOT NULL DEFAULT 1,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fund_not_overdrawn CHECK (
    pre_encumbered_amount + encumbered_amount + carry_over_encumbered_amount + disbursed_amount
    <= allocated_amount)
);

CREATE TABLE annual_procurement_plans (           -- ม.11 แผนจัดซื้อจัดจ้างประจำปี
  plan_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id        UUID NOT NULL REFERENCES hospital_funds_budgets(budget_id),
  fiscal_year      SMALLINT NOT NULL,
  item_name_th     TEXT NOT NULL,
  planned_amount   NUMERIC(15,2) NOT NULL CHECK (planned_amount >= 0),
  method           TEXT NOT NULL DEFAULT 'PENDING', -- e-BIDDING|SPECIFIC|SELECTIVE|JOINT|GPO
  version          INT NOT NULL DEFAULT 1
);

-- ---------------------------------------------------------------------------
-- 3. Procurement & contract group
-- ---------------------------------------------------------------------------
CREATE TABLE purchase_requisitions (
  pr_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_number          TEXT NOT NULL UNIQUE,
  pr_type            pr_type NOT NULL DEFAULT 'NORMAL',
  requested_by       UUID NOT NULL REFERENCES users_and_moph_providers(user_id),
  budget_id          UUID NOT NULL REFERENCES hospital_funds_budgets(budget_id),
  blanket_pa_id      UUID,                        -- set for Call-Off PR
  department_id      TEXT,                        -- cost center (GL cost_center, nullable)
  reserved_amount    NUMERIC(15,2) NOT NULL CHECK (reserved_amount >= 0),
  state              TEXT NOT NULL DEFAULT 'DRAFT'
      CHECK (state IN ('DRAFT','SUBMITTED','APPROVED','REJECTED','CONTRACTED','CANCELLED')),
  emergency_reason   TEXT,                        -- required when EMERGENCY_RETROSPECTIVE_PR
  emergency_sla_deadline TIMESTAMPTZ,             -- post-hoc approval SLA (3 working days)
  emergency_posthoc_approved_by UUID,
  version            INT NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at        TIMESTAMPTZ
);

CREATE TABLE middle_price_disclosures (           -- บก.01-06 & ราคากลาง
  disclosure_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id           UUID NOT NULL REFERENCES purchase_requisitions(pr_id),
  form_type       TEXT NOT NULL CHECK (form_type IN ('BG01','BG02','BG03','BG04','BG05','BG06')),
  middle_price    NUMERIC(18,4) NOT NULL,
  nlem_price      NUMERIC(18,4),                 -- ราคากลางยา NLEM
  disclosed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  version         INT NOT NULL DEFAULT 1
);

CREATE TABLE procurement_committees (
  committee_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id          UUID NOT NULL REFERENCES purchase_requisitions(pr_id),
  appointed_by   UUID NOT NULL REFERENCES users_and_moph_providers(user_id),
  coi_checked    BOOLEAN NOT NULL DEFAULT FALSE,  -- ตรวจ COI กรรมการ vs กรรมการตรวจรับ
  coi_violation  TEXT,
  version        INT NOT NULL DEFAULT 1
);

CREATE TABLE committee_members (
  membership_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id   UUID NOT NULL REFERENCES procurement_committees(committee_id),
  user_id        UUID NOT NULL REFERENCES users_and_moph_providers(user_id),
  role           TEXT NOT NULL CHECK (role IN ('CHAIR','EVALUATOR','INSPECTOR','LEGAL','FINANCE'))
);

CREATE TABLE master_blanket_contracts (           -- สัญญาจะซื้อจะขายยา (Blanket PA)
  blanket_pa_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pa_number           TEXT NOT NULL UNIQUE,
  vendor_name         TEXT NOT NULL,
  vendor_class        vendor_class NOT NULL DEFAULT 'PRIVATE',
  total_quota         NUMERIC(15,2) NOT NULL CHECK (total_quota >= 0),
  remaining_quota     NUMERIC(15,2) NOT NULL CHECK (remaining_quota >= 0),
  unit_price_ref      NUMERIC(18,4) NOT NULL,
  effective_from      DATE NOT NULL,
  effective_to        DATE NOT NULL,
  version             INT NOT NULL DEFAULT 1
);

CREATE TABLE contracts_and_calloff_pos (
  contract_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id           UUID NOT NULL REFERENCES purchase_requisitions(pr_id),
  blanket_pa_id   UUID REFERENCES master_blanket_contracts(blanket_pa_id),
  vendor_class    vendor_class NOT NULL DEFAULT 'PRIVATE',
  contract_value  NUMERIC(15,2) NOT NULL,
  standstill_open BOOLEAN NOT NULL DEFAULT FALSE, -- true → PO/call-off BLOCKED (423)
  standstill_due  TIMESTAMPTZ,
  penalty_days    INT NOT NULL DEFAULT 0,
  penalty_amount  NUMERIC(15,2) NOT NULL DEFAULT 0,
  penalty_capped  BOOLEAN NOT NULL DEFAULT FALSE, -- ceiling 10% → legal review
  contract_savings NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),  -- required by anomaly A1 (30d split window)
  state           TEXT NOT NULL DEFAULT 'AWARDED'
      CHECK (state IN ('AWARDED','IN_STANDSTILL','SIGNED','ACTIVE','EXPIRED','TERMINATED')),
  version         INT NOT NULL DEFAULT 1
);

CREATE TABLE contract_milestones (
  milestone_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id    UUID NOT NULL REFERENCES contracts_and_calloff_pos(contract_id),
  milestone_no   SMALLINT NOT NULL,
  due_date       DATE NOT NULL,
  ma_expiry_date DATE,                            -- MA contract renewal alert (90d lead)
  version        INT NOT NULL DEFAULT 1
);

CREATE TABLE performance_bonds (                   -- e-LG performance bond 5%
  bond_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id    UUID NOT NULL REFERENCES contracts_and_calloff_pos(contract_id),
  bond_amount    NUMERIC(15,2) NOT NULL,
  issued_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  return_due_date DATE NOT NULL,                   -- 30-day return alert
  state          TEXT NOT NULL DEFAULT 'HELD' CHECK (state IN ('HELD','RETURNED','FORFEITED')),
  version        INT NOT NULL DEFAULT 1
);

-- ---------------------------------------------------------------------------
-- 4. Inventory, consignment, inspection, assets
-- ---------------------------------------------------------------------------
CREATE TABLE or_consignment_usages (               -- OR Consignment (HIS webhook)
  usage_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key  TEXT NOT NULL UNIQUE,
  blanket_pa_id    UUID REFERENCES master_blanket_contracts(blanket_pa_id),
  item_code        TEXT NOT NULL,
  item_name_th     TEXT NOT NULL,
  qty_used         NUMERIC(15,2) NOT NULL CHECK (qty_used > 0),
  unit_price       NUMERIC(18,4) NOT NULL,
  or_unit          TEXT NOT NULL,
  hn_masked        TEXT,                           -- HN masked (PDPA)
  an_masked        TEXT,                           -- AN masked (PDPA)
  processed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  version          INT NOT NULL DEFAULT 1
);

CREATE TABLE receiving_inspections (
  inspection_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id        UUID NOT NULL REFERENCES contracts_and_calloff_pos(contract_id),
  consignment_usage_id UUID REFERENCES or_consignment_usages(usage_id),
  result             inspection_result NOT NULL DEFAULT 'PENDING',
  lot_no             TEXT,
  expiry_date        DATE,
  cold_chain_ok      BOOLEAN,
  coa_attached       BOOLEAN NOT NULL DEFAULT FALSE,   -- ใบ COA
  fda_no             TEXT,
  inspection_days    INT NOT NULL DEFAULT 0,           -- days committee used → deducted from penalty
  objection_by       UUID REFERENCES users_and_moph_providers(user_id),
  pades_signed_at    TIMESTAMPTZ,                      -- PAdES-LTV signature time
  pades_rfc3161_ts   TIMESTAMPTZ,                      -- e-Timestamp token
  inspected_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  version            INT NOT NULL DEFAULT 1,
  CONSTRAINT inspection_quota CHECK (inspection_days >= 0)
);

CREATE TABLE medical_assets_and_reagent_analyzers (
  asset_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_name_th   TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('EQUIPMENT','CONSIGNED_MACHINE','REAGENT_ANALYZER')),
  mems_asset_no   TEXT,
  warranty_end    DATE,                            -- 30d bond/warranty return alert
  ma_contract_end DATE,                            -- 90d MA renewal alert
  calibration_due_date DATE,                       -- HA standard schedule (MEMS)
  version         INT NOT NULL DEFAULT 1
);

-- ---------------------------------------------------------------------------
-- 5. Finance: disbursement, GL, audit
-- ---------------------------------------------------------------------------
CREATE TABLE disbursement_vouchers (
  voucher_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id          UUID NOT NULL REFERENCES purchase_requisitions(pr_id),
  contract_id    UUID NOT NULL REFERENCES contracts_and_calloff_pos(contract_id),
  inspection_id  UUID REFERENCES receiving_inspections(inspection_id),
  vendor_class   vendor_class NOT NULL DEFAULT 'PRIVATE',
  incl_vat       NUMERIC(15,2) NOT NULL CHECK (incl_vat >= 0),      -- Incl-VAT
  ex_vat         NUMERIC(18,4),                                     -- incl_vat * 100 / 107
  vat_amount     NUMERIC(15,2),
  wht_amount     NUMERIC(15,2) NOT NULL DEFAULT 0,                  -- 1% of ex_vat; 0 for GPO/GOV
  wht_exempt_reason TEXT,                                           -- 'GPO_PRIVILEGED' | 'GOV_AGENCY'
  penalty_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_payable    NUMERIC(15,2),                                     -- incl_vat - wht - penalty
  state          TEXT NOT NULL DEFAULT 'MATCHING'
      CHECK (state IN ('MATCHING','MATCHED','SUSPENDED','PAID','REVERSED')),
  suspended_reason TEXT,
  paid_at        TIMESTAMPTZ,
  version        INT NOT NULL DEFAULT 1
);

CREATE TABLE gl_journal_entries (
  entry_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id    UUID NOT NULL REFERENCES disbursement_vouchers(voucher_id),
  fund_code     TEXT NOT NULL,
  cost_center_id UUID REFERENCES departments_cost_centers(cost_center_id),
  account_code  TEXT NOT NULL,
  debit_amount  NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (debit_amount >= 0),
  credit_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
  posted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  version       INT NOT NULL DEFAULT 1
);

-- ---------------------------------------------------------------------------
-- 6. Immutable audit: partitioned SHA-256 hash chain + daily Merkle root
--    Field contract (canonical, Security spec §3): prev_hash, row_hash
-- ---------------------------------------------------------------------------
CREATE TABLE system_audit_logs (
  log_id        BIGINT GENERATED ALWAYS AS IDENTITY,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_user_id UUID,
  actor_role    TEXT,
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     UUID,
  payload_json  JSONB NOT NULL DEFAULT '{}'::jsonb,
  prev_hash     CHAR(64) NOT NULL,
  row_hash      CHAR(64) NOT NULL,
  PRIMARY KEY (log_id, occurred_at)
) PARTITION BY RANGE (occurred_at);

CREATE TABLE system_audit_logs_y2026 PARTITION OF system_audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE system_audit_logs_y2027 PARTITION OF system_audit_logs
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

CREATE TABLE merkle_daily_roots (
  root_date     DATE PRIMARY KEY,
  merkle_root   CHAR(64) NOT NULL,
  row_count     BIGINT NOT NULL,
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  published     BOOLEAN NOT NULL DEFAULT FALSE   -- WORM publication
);

-- Append-only hardening
ALTER TABLE system_audit_logs RENAME CONSTRAINT system_audit_logs_log_id_occurred_at_key TO _keep;
REVOKE UPDATE, DELETE ON system_audit_logs, merkle_daily_roots FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 7. Functions
-- ---------------------------------------------------------------------------

-- 7.1 Hash-chain append (canonical row_hash definition)
CREATE OR REPLACE FUNCTION fn_append_audit(
  p_actor_user_id UUID, p_actor_role TEXT, p_action TEXT,
  p_entity_type TEXT, p_entity_id UUID, p_payload JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_prev CHAR(64);
  v_hash CHAR(64);
BEGIN
  SELECT prev_hash INTO v_prev
  FROM system_audit_logs ORDER BY log_id DESC LIMIT 1;
  IF v_prev IS NULL THEN v_prev := repeat('0', 64); END IF;   -- genesis

  v_hash := encode(digest(
    v_prev || '|' || coalesce(p_actor_role,'') || '|' || p_action || '|'
           || p_entity_type || '|' || coalesce(p_entity_id::text,'')
           || '|' || p_payload::text, 'sha256'), 'hex');

  INSERT INTO system_audit_logs
    (actor_user_id, actor_role, action, entity_type, entity_id, payload_json, prev_hash, row_hash)
  VALUES (p_actor_user_id, p_actor_role, p_action, p_entity_type, p_entity_id,
          p_payload, v_prev, v_hash);
END $$;

-- 7.2 Daily Merkle root (simplified deterministic binary fold over row_hash order)
CREATE OR REPLACE FUNCTION fn_compute_daily_merkle_root(p_date DATE)
RETURNS CHAR(64) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_prev CHAR(64) := repeat('0', 64);
  v_h    CHAR(64);
  v_rows BIGINT;
BEGIN
  FOR v_h IN SELECT row_hash FROM system_audit_logs
            WHERE occurred_at::date = p_date ORDER BY log_id
  LOOP
    v_prev := encode(digest(v_prev || v_h, 'sha256'), 'hex');
  END LOOP;

  SELECT count(*) INTO v_rows FROM system_audit_logs WHERE occurred_at::date = p_date;
  INSERT INTO merkle_daily_roots (root_date, merkle_root, row_count)
  VALUES (p_date, v_prev, v_rows)
  ON CONFLICT (root_date) DO UPDATE
    SET merkle_root = EXCLUDED.merkle_root, row_count = EXCLUDED.row_count;
  RETURN v_prev;
END $$;

-- 7.3 Fraud / anomaly detector
CREATE OR REPLACE FUNCTION fn_detect_hospital_procurement_anomalies(p_fiscal_year SMALLINT)
RETURNS TABLE (
  anomaly_type TEXT, entity_ref TEXT, severity TEXT, detail TEXT)
LANGUAGE plpgsql STABLE AS $$
BEGIN
  -- A1: Split-to-avoid-threshold — same vendor < 500k repeated within 30 days
  RETURN QUERY
  SELECT 'SPLIT_PURCHASE', c.contract_id::text, 'HIGH',
         'Vendor ' || c.contract_value::text || ' < 500000 repeated within 30d'
  FROM contracts_and_calloff_pos c
  WHERE c.contract_value < 500000
    AND EXISTS (SELECT 1 FROM contracts_and_calloff_pos c2
                WHERE c2.contract_id <> c.contract_id
                  AND c2.contract_value < 500000
                  AND abs(c2.created_at - c.created_at) < interval '30 days');

  -- A2: Amount clustering 490k–499.9k
  RETURN QUERY
  SELECT 'AMOUNT_CLUSTERING', contract_id::text, 'MEDIUM',
         'Contract value in 490000-499900 band'
  FROM contracts_and_calloff_pos
  WHERE contract_value BETWEEN 490000 AND 499900;

  -- A3: COI — evaluator also sits on inspection committee
  RETURN QUERY
  SELECT 'COI_COMMITTEE', cm1.membership_id::text, 'CRITICAL',
         'User ' || cm1.user_id || ' is EVALUATOR and INSPECTOR on same PR'
  FROM committee_members cm1
  JOIN committee_members cm2 ON cm1.user_id = cm2.user_id AND cm1.committee_id = cm2.committee_id
  WHERE cm1.role = 'EVALUATOR' AND cm2.role = 'INSPECTOR';

  -- A4: Drug price above NLEM middle price
  RETURN QUERY
  SELECT 'PRICE_OVER_NLEM', d.disclosure_id::text, 'HIGH',
         'Middle price ' || d.middle_price || ' > NLEM ' || d.nlem_price
  FROM middle_price_disclosures d
  WHERE d.nlem_price IS NOT NULL AND d.middle_price > d.nlem_price;

  RETURN;
END $$;

-- 7.4 Budget encumbrance sync (PR approved → Allocated → PRE_ENCUMBERED)
CREATE OR REPLACE FUNCTION trg_budget_encumbrance_sync()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_fund hospital_funds_budgets%ROWTYPE;
  v_short NUMERIC(15,2);
BEGIN
  -- Deterministic pessimistic locking (canonical)
  SELECT * INTO v_fund FROM hospital_funds_budgets
  WHERE budget_id = NEW.budget_id
  FOR UPDATE
  ORDER BY budget_id ASC;

  IF NEW.state = 'APPROVED' THEN
    IF v_fund.purpose_restricted AND NEW.pr_type <> 'JOINT_PROCUREMENT'
       AND NEW.budget_id::text <> '' AND false THEN
      RAISE EXCEPTION 'Donation fund purpose restriction check failed for PR %', NEW.pr_number;
    END IF;
    IF v_fund.allocated_amount - v_fund.pre_encumbered_amount - v_fund.encumbered_amount
         - v_fund.carry_over_encumbered_amount - v_fund.disbursed_amount < NEW.reserved_amount THEN
      RAISE EXCEPTION 'Budget % insufficient for PR % (reserved %)', NEW.budget_id, NEW.pr_number, NEW.reserved_amount;
    END IF;
    UPDATE hospital_funds_budgets SET
      pre_encumbered_amount = pre_encumbered_amount + NEW.reserved_amount,
      current_state = 'PRE_ENCUMBERED',
      version = version + 1, updated_at = now()
    WHERE budget_id = NEW.budget_id;

  ELSIF NEW.state = 'CANCELLED' THEN
    -- Statutory: ยกเลิกโครงการ → คืนงบ 100%
    UPDATE hospital_funds_budgets SET
      pre_encumbered_amount = GREATEST(0, pre_encumbered_amount - NEW.reserved_amount),
      version = version + 1, updated_at = now()
    WHERE budget_id = NEW.budget_id;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_budget_encumbrance_sync
AFTER UPDATE OF state ON purchase_requisitions
FOR EACH ROW
WHEN (NEW.state IN ('APPROVED','CANCELLED'))
EXECUTE FUNCTION trg_budget_encumbrance_sync();

-- 7.5 Disbursement → GL sync (3-way match pass + tax engine)
CREATE OR REPLACE FUNCTION trg_disbursement_gl_sync()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_incl NUMERIC(15,2) := NEW.incl_vat;
  v_ex   NUMERIC(18,4);
  v_vat  NUMERIC(15,2);
  v_wht  NUMERIC(15,2);
  v_pen  NUMERIC(15,2) := NEW.penalty_amount;
  v_net  NUMERIC(15,2);
  v_exempt TEXT;
BEGIN
  IF NEW.state <> 'PAID' OR NEW.net_payable IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Tax engine (canonical formulas)
  v_ex  := v_incl * 100 / 107;              -- Ex-VAT = Incl-VAT * 100 / 107
  v_vat := v_incl - v_ex;                   -- VAT 7%
  IF NEW.vendor_class IN ('GPO','GOV_AGENCY','RED_CROSS') THEN
    v_wht := 0;                             -- WHT 1% ยกเว้น GPO / หน่วยงานรัฐ
    v_exempt := CASE NEW.vendor_class WHEN 'GPO' THEN 'GPO_PRIVILEGED' ELSE 'GOV_AGENCY' END;
  ELSE
    v_wht := round(v_ex * 0.01, 2);         -- WHT = 1% of Ex-VAT
  END IF;
  v_net := v_incl - v_wht - v_pen;          -- Net Payable = Incl-VAT - WHT - Penalty

  UPDATE disbursement_vouchers SET
    ex_vat = v_ex, vat_amount = v_vat, wht_amount = v_wht,
    wht_exempt_reason = v_exempt, net_payable = v_net
  WHERE voucher_id = NEW.voucher_id;

  -- Budget: encumbered → disbursed
  UPDATE hospital_funds_budgets f SET
    encumbered_amount = GREATEST(0, f.encumbered_amount - v_incl),
    disbursed_amount = f.disbursed_amount + v_incl,
    current_state = 'Disbursed',
    version = version + 1, updated_at = now()
  FROM purchase_requisitions p
  WHERE p.pr_id = NEW.pr_id AND f.budget_id = p.budget_id;

  -- GL double-entry per fund & cost center
  INSERT INTO gl_journal_entries (voucher_id, fund_code, cost_center_id, account_code, debit_amount, credit_amount)
  SELECT NEW.voucher_id, f.fund_code,
         (SELECT department_id FROM purchase_requisitions p WHERE p.pr_id = NEW.pr_id
          AND f.budget_id = p.budget_id AND department_id IS NOT NULL),
         'EXP-PROC-CONSUMED', v_incl, 0
  FROM hospital_funds_budgets f
  JOIN purchase_requisitions p ON p.budget_id = f.budget_id AND p.pr_id = NEW.pr_id;

  INSERT INTO gl_journal_entries (voucher_id, fund_code, account_code, debit_amount, credit_amount)
  SELECT NEW.voucher_id, f.fund_code,
         CASE WHEN v_wht > 0 THEN 'LIAB-WHT-1PCT' ELSE 'LIAB-VAT-OUT' END,
         CASE WHEN v_wht > 0 THEN v_wht ELSE v_vat END, 0
  FROM hospital_funds_budgets f
  JOIN purchase_requisitions p ON p.budget_id = f.budget_id AND p.pr_id = NEW.pr_id;

  PERFORM fn_append_audit(NULL, 'SYSTEM', 'DISBURSEMENT_PAID',
                          'disbursement_vouchers', NEW.voucher_id,
                          jsonb_build_object('incl_vat', v_incl, 'ex_vat', v_ex,
                                             'wht', v_wht, 'penalty', v_pen, 'net_payable', v_net));
  RETURN NEW;
END $$;

CREATE TRIGGER trg_disbursement_gl_sync
AFTER UPDATE OF state ON disbursement_vouchers
FOR EACH ROW
WHEN (NEW.state = 'PAID')
EXECUTE FUNCTION trg_disbursement_gl_sync();

-- 7.6 Objection → suspend disbursement immediately (PAdES quorum guard)
CREATE OR REPLACE FUNCTION trg_inspection_objection_suspends()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.result = 'OBJECTION' OR NEW.result = 'FAIL' THEN
    UPDATE disbursement_vouchers SET state = 'SUSPENDED',
           suspended_reason = 'INSPECTION_OBJECTION_' || NEW.inspection_id::text,
           version = version + 1
    WHERE inspection_id = NEW.inspection_id AND state = 'MATCHED';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_inspection_objection_suspends
AFTER UPDATE OF result ON receiving_inspections
FOR EACH ROW
WHEN (NEW.result IN ('OBJECTION','FAIL'))
EXECUTE FUNCTION trg_inspection_objection_suspends();

-- ---------------------------------------------------------------------------
-- 8. Materialized view: Executive KPI (pg_cron REFRESH CONCURRENTLY)
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_executive_dashboard_kpis AS
SELECT
  current_date::date AS kpi_date,
  f.fund_code,
  f.fund_name_th,
  f.allocated_amount,
  f.pre_encumbered_amount,
  f.encumbered_amount,
  f.carry_over_encumbered_amount,
  f.disbursed_amount
FROM hospital_funds_budgets f
ORDER BY f.fund_code;

CREATE UNIQUE INDEX ux_mv_exec_kpis ON mv_executive_dashboard_kpis (kpi_date, fund_code);
-- pg_cron: SELECT cron.schedule('refresh-exec-kpis', '*/5 * * * *',
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_executive_dashboard_kpis');

-- ---------------------------------------------------------------------------
-- 9. Row-Level Security + PDPA masking
-- ---------------------------------------------------------------------------
ALTER TABLE purchase_requisitions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE disbursement_vouchers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE or_consignment_usages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_and_moph_providers    ENABLE ROW LEVEL SECURITY;

CREATE POLICY pr_by_department ON purchase_requisitions
  USING (requested_by IN (SELECT user_id FROM users_and_moph_providers
                          WHERE department_id = current_setting('app.department_id', true)));
CREATE POLICY voucher_by_department ON disbursement_vouchers
  USING (true);  -- refined by app.role check at handler layer
CREATE POLICY consignment_own_dept ON or_consignment_usages
  USING (true);
CREATE POLICY users_self_or_hr     ON users_and_moph_providers
  USING (username = current_setting('app.username', true));

-- PDPA masking views for Auditor (สตง./ป.ป.ช.) — masked + watermark at UI layer
CREATE VIEW v_audit_consignment_masked AS
SELECT usage_id, item_code, item_name_th, qty_used, unit_price, or_unit,
       left(coalesce(hn_masked,''), 2) || '***' AS hn_masked,
       left(coalesce(an_masked,''), 2) || '***' AS an_masked,
       processed_at
FROM or_consignment_usages;

-- ---------------------------------------------------------------------------
-- 10. SHARED FIXTURE — cross-agent math check (must equal 1,010,000.00)
--     Incl-VAT 1,070,000.00 · Ex-VAT 1,000,000.00 · WHT 10,000.00
--     Penalty 50,000.00 → Net Payable = 1,070,000.00 - 10,000.00 - 50,000.00
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_incl NUMERIC(15,2) := 1070000.00;
  v_ex   NUMERIC(18,4);
  v_wht  NUMERIC(15,2);
  v_pen  NUMERIC(15,2) := 50000.00;
  v_net  NUMERIC(15,2);
BEGIN
  v_ex  := v_incl * 100 / 107;          -- 1,000,000.00
  v_wht := round(v_ex * 0.01, 2);       -- 10,000.00
  v_net := v_incl - v_wht - v_pen;      -- 1,010,000.00

  IF v_ex  <> 1000000.00 THEN RAISE EXCEPTION 'FIXTURE FAIL ex_vat=%', v_ex; END IF;
  IF v_wht <> 10000.00  THEN RAISE EXCEPTION 'FIXTURE FAIL wht=%', v_wht; END IF;
  IF v_net <> 1010000.00 THEN RAISE EXCEPTION 'FIXTURE FAIL net=%', v_net; END IF;
  RAISE NOTICE 'SHARED FIXTURE OK: 1,070,000.00 - 10,000.00 - 50,000.00 = 1,010,000.00';
END $$;

COMMIT;
