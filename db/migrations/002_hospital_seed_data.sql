-- ============================================================================
-- HOS-BACKOFFICE — 002_hospital_seed_data.sql  (Phase 2, MASTER_DIRECTIVE §4)
-- Run AFTER 001_hospital_eprocurement_schema.sql (alphabetical initdb order).
--
--   • 5 departments / cost centers (1,000-bed hospital)
--   • 6 Argon2id users (password: Hos@2560 — demo only, replace in prod)
--     ALL bound to MOPH Provider ID + hcode 10670 (5 หลัก) + council code
--   • 5 hospital funds, fiscal year 2569 — ALL satisfy fund_not_overdrawn
--   • gov_holiday_calendar 2026 (verify against official gazette before prod)
--   • drug_medical_catalog (NLEM references) — table created here (not in 001)
--   • Blanket PA BLK-2026-MED-014, 2 PRs, contract CT-2026-0012 (standstill
--     OPEN), bond, OR consignment usage, inspection PASS, disbursement
--     voucher = SHARED FIXTURE: incl 1,070,000.00 → net 1,010,000.00
--   • audit chain bootstrap via fn_append_audit (genesis = 64 zeros)
--
-- Deterministic UUID scheme (readable prefixes):
--   users 1100xxxx  funds 2100xxxx  blanket 3100xxxx  PRs 4100xxxx
--   contract 5100xxxx  bond 6100xxxx  consignment 7100xxxx
--   inspection 8100xxxx  voucher 9100xxxx  assets 9200xxxx
-- ============================================================================
BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Departments / cost centers
-- ----------------------------------------------------------------------------
INSERT INTO departments_cost_centers (department_id, name_th, version) VALUES
  ('clinical-pharma',    'คลินิกเภสัชกรรม & โรงพยาบาล', 1),
  ('budget',             'กลุ่มงานงบประมาณ',                1),
  ('procurement',        'กลุ่มงานจัดซื้อจัดจ้าง',           1),
  ('legal',              'กลุ่มงานกฎหมาย',                  1),
  ('finance',            'กลุ่มงานบัญชี & เบิกจ่าย',          1)
ON CONFLICT (department_id) DO UPDATE SET name_th = EXCLUDED.name_th;

-- ----------------------------------------------------------------------------
-- 2. Users — Argon2id (m=65536,t=3,p=4) password: Hos@2560 (DEMO ONLY)
--    MOPH Provider ID + hcode 10670 + council code; 2FA already verified
-- ----------------------------------------------------------------------------
INSERT INTO users_and_moph_providers
  (user_id, username, password_hash, moph_provider_id, hcode, council_code,
   department_id, two_factor_verified_at, version)
VALUES
  ('11000000-0000-4000-8000-000000000001', 'pharmacist.chai',
   '$argon2id$v=19$m=65536,t=3,p=4$cN6pPYhfhpcJbV9PbnJVDQ$ShjCNLkk60G/BoCtIIUrHNrMvh+oBpikiUKWbMRPUh4',
   'MOPH-10670-PH-01', '10670', 'A52311', 'clinical-pharma', now(), 1),
  ('11000000-0000-4000-8000-000000000002', 'budget.som',
   '$argon2id$v=19$m=65536,t=3,p=4$cN6pPYhfhpcJbV9PbnJVDQ$ShjCNLkk60G/BoCtIIUrHNrMvh+oBpikiUKWbMRPUh4',
   'MOPH-10670-BD-02', '10670', 'B21456', 'budget', now(), 1),
  ('11000000-0000-4000-8000-000000000003', 'procurement.pri',
   '$argon2id$v=19$m=65536,t=3,p=4$cN6pPYhfhpcJbV9PbnJVDQ$ShjCNLkk60G/BoCtIIUrHNrMvh+oBpikiUKWbMRPUh4',
   'MOPH-10670-PR-03', '10670', 'C30578', 'procurement', now(), 1),
  ('11000000-0000-4000-8000-000000000004', 'legal.narong',
   '$argon2id$v=19$m=65536,t=3,p=4$cN6pPYhfhpcJbV9PbnJVDQ$ShjCNLkk60G/BoCtIIUrHNrMvh+oBpikiUKWbMRPUh4',
   'MOPH-10670-LG-04', '10670', 'L47821', 'legal', now(), 1),
  ('11000000-0000-4000-8000-000000000005', 'finance.kanok',
   '$argon2id$v=19$m=65536,t=3,p=4$cN6pPYhfhpcJbV9PbnJVDQ$ShjCNLkk60G/BoCtIIUrHNrMvh+oBpikiUKWbMRPUh4',
   'MOPH-10670-FN-05', '10670', 'F66201', 'finance', now(), 1),
  ('11000000-0000-4000-8000-000000000006', 'auditor.sta',
   '$argon2id$v=19$m=65536,t=3,p=4$cN6pPYhfhpcJbV9PbnJVDQ$ShjCNLkk60G/BoCtIIUrHNrMvh+oBpikiUKWbMRPUh4',
   'MOPH-10670-AUD-06', '10670', 'G88013', 'finance', now(), 1)
ON CONFLICT (user_id) DO NOTHING;

-- Auth session audit — one L1 (local) and one L2 (MOPH OIDC) sample
INSERT INTO auth_sessions_audit (session_id, user_id, auth_layer, ip_address, user_agent, granted_at, version)
VALUES
  ('0a100000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', 'L1_LOCAL',     '172.16.10.11', 'Chrome/126 Win10', now() - interval '2 days', 1),
  ('0a100000-0000-4000-8000-000000000002', '11000000-0000-4000-8000-000000000005', 'L2_MOPH_OIDC', '172.16.10.21', 'Chrome/126 Win10', now() - interval '1 day',  1)
ON CONFLICT (session_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Government holiday calendar 2026 (verify against official gazette)
-- ----------------------------------------------------------------------------
INSERT INTO gov_holiday_calendar (holiday_date, holiday_name_th, is_special_cabinet_day) VALUES
  ('2026-01-01', 'วันขึ้นปีใหม่',                    FALSE),
  ('2026-02-15', 'วันมาฆบูชา',                     FALSE),
  ('2026-03-28', 'วันสงกรานต์',                     FALSE),
  ('2026-03-29', 'วันสงกรานต์',                     FALSE),
  ('2026-03-30', 'วันสงกรานต์ (ชดเชย)',             FALSE),
  ('2026-04-06', 'วันจักรี',                        FALSE),
  ('2026-04-19', 'วันวิสาขบูชา',                   FALSE),
  ('2026-05-01', 'วันแรงงานแห่งชาติ',              FALSE),
  ('2026-05-31', 'วันฉัตรมงคล',                    FALSE),
  ('2026-06-03', 'วันเฉลิมพระชนมพรรษา',             FALSE),
  ('2026-07-28', 'วันเฉลิมพระชนมพรรษา ร.9',         TRUE),
  ('2026-08-12', 'วันเข้าพรรษา',                     FALSE),
  ('2026-10-13', 'วันนวมินทรมหาราช',               FALSE),
  ('2026-10-23', 'วันปิยมหาราช',                   FALSE),
  ('2026-12-05', 'วันพ่อแห่งชาติ',                  FALSE),
  ('2026-12-31', 'วันสิ้นปี (ปิดระบบงาน)',         TRUE)
ON CONFLICT (holiday_date) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Drug / medical catalog (NLEM references) — table not in 001
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drug_medical_catalog (
  item_code        TEXT UNIQUE NOT NULL,
  name_th          TEXT NOT NULL,
  category         TEXT NOT NULL CHECK (category IN ('LIFE_SAVING','ANTIVIRAL','REAGENT_RENTAL','OR_CONSIGNMENT')),
  unit             TEXT,
  nlem_unit_price  NUMERIC(18,4) NOT NULL CHECK (nlem_unit_price >= 0),
  nlem_reference   TEXT
);

INSERT INTO drug_medical_catalog (item_code, name_th, category, unit, nlem_unit_price, nlem_reference) VALUES
  ('EPI-0101', 'Epinephrine Injection 1:1000',        'LIFE_SAVING',      'vial',   45.0000,   'NLEM-2026-0101'),
  ('RX-0142',  'Antiviral — OR Lot 26A (consignment)','OR_CONSIGNMENT',   'กล่อง (10 vials)', 8500.0000, 'NLEM-2026-0142'),
  ('AV-0233',  'ยาต้านไวรัส (Antiviral)',            'ANTIVIRAL',        'กล่อง',  1250.0000,  'NLEM-2026-0233'),
  ('RG-0310',  'Reagent Rental — เครื่องวิเคราะห์',    'REAGENT_RENTAL',   'เดือน',  28000.0000,'NLEM-2026-0310'),
  ('ST-0420',  'ถุงมือผ่าตัด (OR consignment)',       'OR_CONSIGNMENT',   'กล่อง',  25.0000,    'NLEM-2026-0420'),
  ('AN-0510',  'ยาสลบ (Anesthetic)',                 'LIFE_SAVING',      'vial',   320.0000,   'NLEM-2026-0510')
ON CONFLICT (item_code) DO UPDATE SET name_th = EXCLUDED.name_th, nlem_unit_price = EXCLUDED.nlem_unit_price;

-- ----------------------------------------------------------------------------
-- 5. Hospital funds — fiscal year 2569 (all satisfy fund_not_overdrawn)
-- ----------------------------------------------------------------------------
INSERT INTO hospital_funds_budgets
  (budget_id, fiscal_year, fund_code, fund_name_th, purpose_restricted, purpose_text,
   line_item_code, allocated_amount, pre_encumbered_amount, encumbered_amount,
   carry_over_encumbered_amount, disbursed_amount, current_state, version)
VALUES
  ('21000000-0000-4000-8000-000000000001', 2569, 'GOV_BUDGET',           'งบแผ่นดิน (GOV_BUDGET)',
   FALSE, 'งบรายจ่ายประจำปีงบประมาณ 2569',          'B101-0102', 450000000, 60000000, 200000000, 15000000, 160000000, 'PRE_ENCUMBERED', 1),
  ('21000000-0000-4000-8000-000000000002', 2569, 'HOSPITAL_MAINTENANCE', 'เงินบำรุงโรงพยาบาล',
   FALSE, 'รายได้อันเกิดจากกิจการโรงพยาบาล',        'B201-0101', 320000000, 25000000, 120000000,  8000000,  140000000,'Encumbered', 1),
  ('21000000-0000-4000-8000-000000000003', 2569, 'DONATION_SPECIFIED',   'เงินบริจาค ระบุวัตถุประสงค์',
   TRUE,  'เงินบริจาคระบุวัตถุประสงค์ — ศูนย์หัวใจ',  'B301-0102',  60000000,  5000000,  20000000,       0,   30000000, 'PRE_ENCUMBERED', 1),
  ('21000000-0000-4000-8000-000000000004', 2569, 'DONATION_UNSPECIFIED', 'เงินบริจาค ไม่ระบุวัตถุประสงค์',
   FALSE, 'เงินบริจาคทั่วไป (ตามระเบียบ สคร.)',       'B302-0101',  40000000,  2000000,  12000000,   1000000,  20000000, 'Encumbered', 1),
  ('21000000-0000-4000-8000-000000000005', 2569, 'UC_DEPRECIATION',      'ค่าเสื่อม UC',
   FALSE, 'เงินค่าเสื่อมทุนบำรุง (UC)',                'B401-0101',  90000000, 10000000,  25000000,   3000000,  40000000, 'Encumbered', 1)
ON CONFLICT DO NOTHING;

-- Annual procurement plans
INSERT INTO annual_procurement_plans (budget_id, fiscal_year, item_name_th, planned_amount, method, version) VALUES
  ('21000000-0000-4000-8000-000000000001', 2569, 'ยาและเวชภัณฑ์ (Blanket PA BLK-2026-MED-014)', 20000000, 'BLANKET_PA', 1),
  ('21000000-0000-4000-8000-000000000002', 2569, 'ยาต้านไวรัส กรณีฉุกเฉิน',                         25000000, 'EMERGENCY',  1)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. Blanket PA  (quota 20M, remaining 3.4M — consistent with workspace demo)
-- ----------------------------------------------------------------------------
INSERT INTO master_blanket_contracts
  (blanket_pa_id, pa_number, vendor_name, vendor_class, total_quota, remaining_quota,
   unit_price_ref, effective_from, effective_to, version)
VALUES
  ('31000000-0000-4000-8000-000000000001', 'BLK-2026-MED-014', 'บริษัท เภสัชภัณฑ์ จำกัด', 'PRIVATE',
   20000000, 3400000, 1.0000, '2026-01-01', '2026-12-31', 1)
ON CONFLICT (pa_number) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. Purchase requisitions
-- ----------------------------------------------------------------------------
INSERT INTO purchase_requisitions
  (pr_id, pr_number, pr_type, requested_by, budget_id, blanket_pa_id, department_id,
   reserved_amount, state, version, created_at, approved_at)
VALUES
  ('41000000-0000-4000-8000-000000000001', 'PR-2026-0421', 'NORMAL',
   '11000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001',
   '31000000-0000-4000-8000-000000000001', 'clinical-pharma',
   60000000, 'APPROVED', 1, now() - interval '12 days', now() - interval '10 days'),
  ('41000000-0000-4000-8000-000000000002', 'PR-2026-0557', 'EMERGENCY_RETROSPECTIVE_PR',
   '11000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000002',
   NULL, 'clinical-pharma',
   25000000, 'SUBMITTED', 1, now() - interval '1 day', NULL)
ON CONFLICT (pr_number) DO NOTHING;

-- Emergency PR: reason + post-hoc SLA (3 working days from 2026-11-01 → 2026-11-04)
UPDATE purchase_requisitions
   SET emergency_reason     = 'เหตุฉุกเฉิน — ยาต้านไวรัสหมดสต็อก ผู้ป่วยวิกฤต',
       emergency_sla_deadline = '2026-11-04 18:00:00+07'
 WHERE pr_number = 'PR-2026-0557';

-- Middle price disclosure (BG-03) for the normal PR
INSERT INTO middle_price_disclosures (pr_id, form_type, middle_price, nlem_price, disclosed_at, version)
VALUES
  ('41000000-0000-4000-8000-000000000001', 'BG03', 8400.0000, 8500.0000, now() - interval '9 days', 1)
ON CONFLICT DO NOTHING;

-- Procurement committee (COI checked) + members
INSERT INTO procurement_committees (pr_id, appointed_by, coi_checked, coi_violation, version)
VALUES
  ('41000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000003', TRUE, FALSE, 1)
ON CONFLICT DO NOTHING;

INSERT INTO committee_members (committee_id, user_id, role)
SELECT c.committee_id, u.user_id, m.role
FROM procurement_committees c
CROSS JOIN (
  VALUES ('11000000-0000-4000-8000-000000000003','CHAIR'),
         ('11000000-0000-4000-8000-000000000004','LEGAL'),
         ('11000000-0000-4000-8000-000000000005','FINANCE'),
         ('11000000-0000-4000-8000-000000000001','INSPECTOR')
) AS m(user_id, role)
WHERE c.pr_id = '41000000-0000-4000-8000-000000000001'
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. Contract CT-2026-0012 — IN_STANDSTILL (open, due 2026-11-06)
-- ----------------------------------------------------------------------------
INSERT INTO contracts_and_calloff_pos
  (contract_id, pr_id, blanket_pa_id, vendor_class, contract_value,
   standstill_open, standstill_due, state, version)
VALUES
  ('51000000-0000-4000-8000-000000000001',
   '41000000-0000-4000-8000-000000000001',
   '31000000-0000-4000-8000-000000000001',
   'PRIVATE', 12000000, TRUE, '2026-11-06 18:00:00+07', 'IN_STANDSTILL', 1)
ON CONFLICT DO NOTHING;

INSERT INTO contract_milestones (contract_id, milestone_no, due_date, ma_expiry_date, version)
VALUES
  ('51000000-0000-4000-8000-000000000001', 1, '2026-12-15', NULL,        1),
  ('51000000-0000-4000-8000-000000000001', 2, NULL,       '2027-03-31', 1)
ON CONFLICT DO NOTHING;

-- Performance bond — 5% of contract value, HELD
INSERT INTO performance_bonds (contract_id, bond_amount, issued_at, return_due_date, state, version)
VALUES
  ('61000000-0000-4000-8000-000000000001',
   '51000000-0000-4000-8000-000000000001',
   600000, now() - interval '9 days', '2027-01-15', 'HELD', 1)
ON CONFLICT DO NOTHING;

-- Medical / reagent assets (warranty + MA renewal alerts)
INSERT INTO medical_assets_and_reagent_analyzers
  (asset_name_th, category, mems_asset_no, warranty_end, ma_contract_end, calibration_due_date, version)
VALUES
  ('เครื่องวิเคราะห์ Reagent Analyzer (rental)', 'REAGENT_ANALYZER', 'MS-10231', NULL,        '2027-01-31', '2026-11-15', 1),
  ('เครื่องช่วยหายใจ ICU-3 (EQUIPMENT)',        'EQUIPMENT',        'MS-10942', '2026-12-01', NULL,        '2026-12-20', 1)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 9. OR consignment usage (idempotent webhook payload)
-- ----------------------------------------------------------------------------
INSERT INTO or_consignment_usages
  (usage_id, idempotency_key, blanket_pa_id, item_code, item_name_th, qty_used,
   unit_price, or_unit, hn_masked, an_masked, processed_at, version)
VALUES
  ('71000000-0000-4000-8000-000000000001', 'HIS-2026-11-01-0001',
   '31000000-0000-4000-8000-000000000001', 'RX-0142',
   'Antiviral — OR Lot 26A (consignment)', 12, 8500.0000, 'กล่อง (10 vials)',
   '72***', 'A5***', '2026-11-01 09:30:00+07', 1)
ON CONFLICT (idempotency_key) DO NOTHING;

-- Inspection — PASS (Lot/Expiry/Cold-Chain/COA), PAdES-LTV signed
INSERT INTO receiving_inspections
  (contract_id, consignment_usage_id, result, lot_no, expiry_date, cold_chain_ok,
   coa_attached, fda_no, inspection_days, pades_signed_at, pades_rfc3161_ts, inspected_at, version)
VALUES
  ('51000000-0000-4000-8000-000000000001',
   '71000000-0000-4000-8000-000000000001',
   'PASS', '26A', '2027-06-30', TRUE, TRUE, '10-1-5555-8888', 2,
   '2026-11-01 10:05:00+07', '2026-11-01 10:07:00+07', '2026-11-01 09:45:00+07', 1)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 10. Disbursement voucher — THE SHARED FIXTURE
--     incl 1,070,000.00 | ex-vat 1,000,000.00 | VAT 70,000.00
--     WHT 10,000.00 | penalty 50,000.00 → NET PAYABLE 1,010,000.00 (PAID)
-- ----------------------------------------------------------------------------
INSERT INTO disbursement_vouchers
  (voucher_id, pr_id, contract_id, inspection_id, vendor_class,
   incl_vat, ex_vat, vat_amount, wht_amount, wht_exempt_reason,
   penalty_amount, net_payable, state, paid_at, version)
VALUES
  ('91000000-0000-4000-8000-000000000001',
   '41000000-0000-4000-8000-000000000001',
   '51000000-0000-4000-8000-000000000001',
   '81000000-0000-4000-8000-000000000001',
   'PRIVATE',
   1070000.00, 1000000.00, 70000.00, 10000.00, NULL,
   50000.00, 1010000.00, 'PAID', '2026-11-01 11:00:00+07', 1)
ON CONFLICT DO NOTHING;

-- GL entries for the paid voucher (debit expense / credit VAT / credit WHT)
INSERT INTO gl_journal_entries (voucher_id, fund_code, cost_center_id, account_code, debit_amount, credit_amount, posted_at, version)
VALUES
  ('91000000-0000-4000-8000-000000000001', 'GOV_BUDGET', 'clinical-pharma', '6101-EXP',   1070000.00, 0,        '2026-11-01 11:00:00+07', 1),
  ('91000000-0000-4000-8000-000000000001', 'GOV_BUDGET', 'clinical-pharma', '2110-VAT',   0,           70000.00, '2026-11-01 11:00:00+07', 1),
  ('91000000-0000-4000-8000-000000000001', 'GOV_BUDGET', 'clinical-pharma', '2120-WHT',   0,           10000.00, '2026-11-01 11:00:00+07', 1)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 11. Audit chain bootstrap (genesis row_hash = 64 zeros via fn_append_audit)
-- ----------------------------------------------------------------------------
SELECT fn_append_audit(
  '11000000-0000-4000-8000-000000000003', 'PROCUREMENT_OFFICER', 'PR.APPROVE',
  'purchase_requisitions', '41000000-0000-4000-8000-000000000001',
  jsonb_build_object('pr_number','PR-2026-0421','reserved_amount',60000000)
);

SELECT fn_append_audit(
  '11000000-0000-4000-8000-000000000005', 'FINANCE_OFFICER', 'VOUCHER.PAY',
  'disbursement_vouchers', '91000000-0000-4000-8000-000000000001',
  jsonb_build_object('incl_vat',1070000.00,'ex_vat',1000000.00,'vat',70000.00,
                     'wht',10000.00,'penalty',50000.00,'net_payable',1010000.00)
);

-- ----------------------------------------------------------------------------
-- 12. SHARED FIXTURE ASSERTION — abort the seed if the canonical numbers drift
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_incl NUMERIC; v_ex NUMERIC; v_vat NUMERIC;
  v_wht NUMERIC; v_pen NUMERIC; v_net NUMERIC;
BEGIN
  SELECT incl_vat, ex_vat, vat_amount, wht_amount, penalty_amount, net_payable
    INTO v_incl, v_ex, v_vat, v_wht, v_pen, v_net
    FROM disbursement_vouchers
   WHERE voucher_id = '91000000-0000-4000-8000-000000000001';

  IF v_net IS DISTINCT FROM 1010000.00 THEN
    RAISE EXCEPTION 'FIXTURE FAIL: net_payable = % (expected 1010000.00)', v_net;
  END IF;
  IF v_incl IS DISTINCT FROM 1070000.00 OR v_ex IS DISTINCT FROM 1000000.00
     OR v_vat IS DISTINCT FROM 70000.00 OR v_wht IS DISTINCT FROM 10000.00
     OR v_pen IS DISTINCT FROM 50000.00 THEN
    RAISE EXCEPTION 'FIXTURE FAIL: canonical 3-way values drifted (incl %, ex %, vat %, wht %, pen %)',
      v_incl, v_ex, v_vat, v_wht, v_pen;
  END IF;
END
$$;

COMMIT;

-- Refresh the executive KPI view so the dashboard reflects the seed immediately
REFRESH MATERIALIZED VIEW mv_executive_dashboard_kpis;
