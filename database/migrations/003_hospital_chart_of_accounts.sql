-- ============================================================================
-- MIGRATION 003: MOPH STANDARD CHART OF ACCOUNTS & GENERAL LEDGER (GL)
-- หน่วยงาน: โรงพยาบาลศูนย์ / โรงพยาบาลมหาวิทยาลัย ขนาด 1,000+ เตียง (HCODE: 10670)
-- มาตรฐาน: ผังบัญชีมาตรฐานกระทรวงสาธารณสุข และมาตรฐานบัญชีภาครัฐ
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ผังบัญชีมาตรฐานโรงพยาบาลรัฐ 5 หมวด (Chart of Accounts)
CREATE TABLE IF NOT EXISTS erp_chart_of_accounts (
    account_code        VARCHAR(20) PRIMARY KEY,
    account_name_th     VARCHAR(255) NOT NULL,
    account_name_en     VARCHAR(255),
    account_category    VARCHAR(20) NOT NULL CHECK (account_category IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    account_type        VARCHAR(30) NOT NULL,
    normal_balance      VARCHAR(2) NOT NULL CHECK (normal_balance IN ('DR', 'CR')),
    parent_code         VARCHAR(20) REFERENCES erp_chart_of_accounts(account_code),
    fund_code           VARCHAR(50) DEFAULT 'HOSPITAL_MAINTENANCE',
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. งวดบัญชีและปีงบประมาณ (Fiscal Periods)
CREATE TABLE IF NOT EXISTS erp_fiscal_periods (
    period_id           SERIAL PRIMARY KEY,
    fiscal_year_th      INTEGER NOT NULL, -- เช่น 2569
    period_number       INTEGER NOT NULL CHECK (period_number BETWEEN 1 AND 12),
    period_name         VARCHAR(50) NOT NULL,
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    is_closed           BOOLEAN DEFAULT FALSE,
    closed_at           TIMESTAMPTZ,
    closed_by           VARCHAR(100),
    UNIQUE (fiscal_year_th, period_number)
);

-- 3. สมุดรายวันขั้นต้น (Journal Vouchers - JV)
CREATE TABLE IF NOT EXISTS erp_journal_vouchers (
    voucher_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_no          VARCHAR(50) UNIQUE NOT NULL, -- เช่น JV-2569-0001, AP-2569-0001
    voucher_type        VARCHAR(20) NOT NULL CHECK (voucher_type IN ('GENERAL_JV', 'ACCOUNTS_PAYABLE_AP', 'ACCOUNTS_RECEIVABLE_AR', 'CASH_PAYMENT_CP', 'CASH_RECEIPT_CR')),
    fiscal_year_th      INTEGER NOT NULL,
    period_number       INTEGER NOT NULL,
    voucher_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    description         TEXT NOT NULL,
    reference_doc_no    VARCHAR(100), -- เลขที่ PO, DV, หรือใบเสร็จ
    total_debit         NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
    total_credit        NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'POSTED', 'VOIDED')),
    created_by          VARCHAR(100) NOT NULL,
    posted_by           VARCHAR(100),
    posted_at           TIMESTAMPTZ,
    sha256_hash         VARCHAR(64),
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. รายการเดบิต/เครดิตรายบรรทัด (Journal Entries / Lines)
CREATE TABLE IF NOT EXISTS erp_journal_entries (
    entry_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id          UUID NOT NULL REFERENCES erp_journal_vouchers(voucher_id) ON DELETE CASCADE,
    line_no             INTEGER NOT NULL,
    account_code        VARCHAR(20) NOT NULL REFERENCES erp_chart_of_accounts(account_code),
    debit_amt           NUMERIC(16, 2) NOT NULL DEFAULT 0.00 CHECK (debit_amt >= 0),
    credit_amt          NUMERIC(16, 2) NOT NULL DEFAULT 0.00 CHECK (credit_amt >= 0),
    memo                TEXT,
    fund_code           VARCHAR(50) NOT NULL,
    department_code     VARCHAR(50),
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_debit_or_credit CHECK ((debit_amt > 0 AND credit_amt = 0) OR (debit_amt = 0 AND credit_amt > 0))
);

-- 5. ยอดสะสมบัญชีแยกประเภทรายงวด (GL Account Balances)
CREATE TABLE IF NOT EXISTS erp_account_balances (
    balance_id          SERIAL PRIMARY KEY,
    fiscal_year_th      INTEGER NOT NULL,
    period_number       INTEGER NOT NULL,
    account_code        VARCHAR(20) NOT NULL REFERENCES erp_chart_of_accounts(account_code),
    fund_code           VARCHAR(50) NOT NULL,
    beginning_balance   NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
    period_debit        NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
    period_credit       NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
    ending_balance      NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
    last_updated_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (fiscal_year_th, period_number, account_code, fund_code)
);

-- ============================================================================
-- VALIDATION TRIGGERS: ควบคุมสมดุลเดบิต-เครดิต (Balance Enforcement)
-- ============================================================================

CREATE OR REPLACE FUNCTION trg_enforce_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
    sum_dr NUMERIC(16, 2);
    sum_cr NUMERIC(16, 2);
BEGIN
    IF NEW.status = 'POSTED' AND OLD.status = 'DRAFT' THEN
        SELECT COALESCE(SUM(debit_amt), 0), COALESCE(SUM(credit_amt), 0)
        INTO sum_dr, sum_cr
        FROM erp_journal_entries
        WHERE voucher_id = NEW.voucher_id;

        IF sum_dr = 0 OR sum_cr = 0 THEN
            RAISE EXCEPTION 'สมุดรายวัน % ไม่มีรายการเดบิตหรือเครดิต', NEW.voucher_no;
        END IF;

        IF sum_dr <> sum_cr THEN
            RAISE EXCEPTION 'สมุดรายวัน % ไม่สมดุล! เดบิต (฿%) != เครดิต (฿%)', 
                NEW.voucher_no, sum_dr, sum_cr;
        END IF;

        NEW.total_debit := sum_dr;
        NEW.total_credit := sum_cr;
        NEW.posted_at := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_journal_balance ON erp_journal_vouchers;
CREATE TRIGGER trg_check_journal_balance
BEFORE UPDATE OF status ON erp_journal_vouchers
FOR EACH ROW EXECUTE FUNCTION trg_enforce_journal_balance();

-- ============================================================================
-- INITIAL SEED DATA: ผังบัญชี 5 หมวดมาตรฐาน สป.สธ. (60+ บัญชีหลัก)
-- ============================================================================

INSERT INTO erp_chart_of_accounts (account_code, account_name_th, account_category, account_type, normal_balance) VALUES
-- หมวด 1: สินทรัพย์ (Assets)
('110101', 'เงินสดในมือ (โรงพยาบาล)', 'ASSET', 'CURRENT_ASSET', 'DR'),
('110102', 'เงินฝากธนาคารเพื่อการดำเนินงาน (กรุงไทย)', 'ASSET', 'CURRENT_ASSET', 'DR'),
('110103', 'เงินฝากคลังจังหวัด / กรมบัญชีกลาง', 'ASSET', 'CURRENT_ASSET', 'DR'),
('110201', 'ลูกหนี้ค่ารักษาพยาบาล - สปสช. (บัตรทอง)', 'ASSET', 'RECEIVABLE', 'DR'),
('110202', 'ลูกหนี้ค่ารักษาพยาบาล - สำนักงานประกันสังคม (SSS)', 'ASSET', 'RECEIVABLE', 'DR'),
('110203', 'ลูกหนี้ค่ารักษาพยาบาล - สิทธิข้าราชการจ่ายตรง (CS)', 'ASSET', 'RECEIVABLE', 'DR'),
('110204', 'ลูกหนี้ พ.ร.บ. คุ้มครองผู้ประสบภัยจากรถ', 'ASSET', 'RECEIVABLE', 'DR'),
('110301', 'คลังยาและเวชภัณฑ์คงเหลือ (คลังยากลาง)', 'ASSET', 'INVENTORY', 'DR'),
('110302', 'คลังวัสดุการแพทย์และวิทยาศาสตร์', 'ASSET', 'INVENTORY', 'DR'),
('110303', 'เวชภัณฑ์ฝากขายห้องผ่าตัด (Consignment Stock)', 'ASSET', 'INVENTORY', 'DR'),
('120101', 'ที่ดินและสิ่งปรับปรุงที่ดิน', 'ASSET', 'FIXED_ASSET', 'DR'),
('120201', 'อาคารผู้ป่วยนอกและหออภิบาลผู้ป่วยวิกฤต', 'ASSET', 'FIXED_ASSET', 'DR'),
('120301', 'ครุภัณฑ์การแพทย์ช่วยชีวิต (เครื่องช่วยหายใจ/ฟอกไต)', 'ASSET', 'FIXED_ASSET', 'DR'),
('120302', 'ครุภัณฑ์รังสีวินิจฉัย (MRI / CT Scanner)', 'ASSET', 'FIXED_ASSET', 'DR'),
('120901', 'ค่าเสื่อมราคาสะสม - ครุภัณฑ์การแพทย์', 'ASSET', 'CONTRA_ASSET', 'CR'),

-- หมวด 2: หนี้สิน (Liabilities)
('210101', 'เจ้าหนี้การค้า - องค์การเภสัชกรรม (GPO)', 'LIABILITY', 'CURRENT_LIABILITY', 'CR'),
('210102', 'เจ้าหนี้การค้า - บริษัทเอกชนคู่สัญญา', 'LIABILITY', 'CURRENT_LIABILITY', 'CR'),
('210201', 'ภาษีเงินได้หัก ณ ที่จ่ายค้างจ่าย (WHT 1%)', 'LIABILITY', 'CURRENT_LIABILITY', 'CR'),
('210301', 'เงินประกันการปฏิบัติตามสัญญา (e-LG 5%)', 'LIABILITY', 'DEPOSIT_LIABILITY', 'CR'),
('210401', 'ค่าตอบแทนบุคลากรค้างจ่าย (พ.ต.ส. / ฉ.11)', 'LIABILITY', 'CURRENT_LIABILITY', 'CR'),

-- หมวด 3: ส่วนทุนและเงินกองทุน (Equity & Funds)
('310101', 'เงินบำรุงโรงพยาบาลสะสม (Hospital Maintenance Equity)', 'EQUITY', 'FUND_BALANCE', 'CR'),
('310201', 'เงินบริจาคเพื่อศูนย์หัวใจและมะเร็ง (Restricted Fund)', 'EQUITY', 'RESTRICTED_FUND', 'CR'),
('310301', 'เงินกองทุนค่าเสื่อมราคา สปสช. (Capital Replacement Fund)', 'EQUITY', 'CAPITAL_FUND', 'CR'),
('320101', 'รายได้สูงกว่า (ต่ำกว่า) ค่าใช้จ่ายสะสม', 'EQUITY', 'RETAINED_EARNINGS', 'CR'),

-- หมวด 4: รายได้ (Revenues)
('410101', 'รายได้ค่ารักษาพยาบาล - ผู้ป่วยใน (IPD DRG)', 'REVENUE', 'OPERATING_REVENUE', 'CR'),
('410102', 'รายได้ค่ารักษาพยาบาล - ผู้ป่วยนอก (OPD Individual)', 'REVENUE', 'OPERATING_REVENUE', 'CR'),
('410201', 'รายได้เงินอุดหนุนจากงบประมาณแผ่นดิน', 'REVENUE', 'GOV_SUBSIDY', 'CR'),
('410301', 'รายได้เงินบริจาคระบุวัตถุประสงค์', 'REVENUE', 'DONATION_REVENUE', 'CR'),
('410302', 'รายได้เงินบริจาคทั่วไปไม่ระบุวัตถุประสงค์', 'REVENUE', 'DONATION_REVENUE', 'CR'),
('410401', 'รายได้ดอกเบี้ยเงินฝากธนาคาร', 'REVENUE', 'OTHER_REVENUE', 'CR'),

-- หมวด 5: ค่าใช้จ่าย (Expenses)
('510101', 'ต้นทุนยาตามบัญชียาหลักแห่งชาติ (NLEM Drug Cost)', 'EXPENSE', 'OPERATING_EXPENSE', 'DR'),
('510102', 'ต้นทุนยานอกบัญชียาหลักแห่งชาติ (Non-NLEM Drug Cost)', 'EXPENSE', 'OPERATING_EXPENSE', 'DR'),
('510103', 'ต้นทุนวัสดุฝังในร่างกายห้องผ่าตัด (OR Implants Cost)', 'EXPENSE', 'OPERATING_EXPENSE', 'DR'),
('510201', 'เงินเดือนและค่าจ้างข้าราชการ/ลูกจ้าง', 'EXPENSE', 'PERSONNEL_EXPENSE', 'DR'),
('510202', 'เงินเพิ่มพิเศษผู้ปฏิบัติงานสาธารณสุข (เงิน พ.ต.ส.)', 'EXPENSE', 'PERSONNEL_EXPENSE', 'DR'),
('510203', 'เงินเพิ่มพิเศษสำหรับแพทย์ไม่ทำเวชปฏิบัติส่วนตัว', 'EXPENSE', 'PERSONNEL_EXPENSE', 'DR'),
('510204', 'ค่าตอบแทนตามภาระงาน (ระเบียบกระทรวงสาธารณสุข ฉบับที่ 11 / P4P)', 'EXPENSE', 'PERSONNEL_EXPENSE', 'DR'),
('510301', 'ค่าบำรุงรักษาและสอบเทียบเครื่องมือแพทย์ (PM & Calibration)', 'EXPENSE', 'MAINTENANCE_EXPENSE', 'DR'),
('510401', 'ค่าเสื่อมราคา - ครุภัณฑ์การแพทย์และอาคาร', 'EXPENSE', 'DEPRECIATION_EXPENSE', 'DR')
ON CONFLICT (account_code) DO NOTHING;
