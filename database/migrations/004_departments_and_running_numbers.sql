-- ============================================================================
-- MIGRATION 004: HOSPITAL MISSION GROUPS, DEPARTMENTS & RUNNING NUMBER ENGINE
-- SYSTEM: HOS-BACKOFFICE ENTERPRISE (LARGE PUBLIC HOSPITAL 1,000+ BEDS, HCODE: 10670)
-- SPECIFICATION: THAI PUBLIC PROCUREMENT ACT B.E. 2560 & MOPH STANDARD STRUCTURE
-- ============================================================================

BEGIN;

-- 1. MISSION GROUPS TABLE (กลุ่มภารกิจโรงพยาบาลศูนย์/ทั่วไป)
CREATE TABLE IF NOT EXISTS hospital_mission_groups (
    group_code VARCHAR(32) PRIMARY KEY,
    group_name_th VARCHAR(255) NOT NULL,
    group_name_en VARCHAR(255),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEPARTMENTS / COST CENTERS TABLE (กลุ่มงาน / แผนก / ศูนย์ต้นทุน สธ.)
CREATE TABLE IF NOT EXISTS hospital_departments (
    department_code VARCHAR(32) PRIMARY KEY,
    group_code VARCHAR(32) NOT NULL REFERENCES hospital_mission_groups(group_code) ON DELETE RESTRICT,
    department_name_th VARCHAR(255) NOT NULL,
    department_name_en VARCHAR(255),
    cost_center_code VARCHAR(32) NOT NULL UNIQUE, -- รหัสศูนย์ต้นทุนตามผังบัญชี สป.สธ.
    head_name VARCHAR(255),                       -- ชื่อหัวหน้ากลุ่มงาน/แผนก
    telephone VARCHAR(64),
    location_building VARCHAR(128),
    floor_number VARCHAR(16),
    is_procurement_authorized BOOLEAN DEFAULT TRUE, -- สิทธิในการออกใบขอซื้อ PR
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_departments_group ON hospital_departments(group_code);
CREATE INDEX IF NOT EXISTS idx_departments_cost_center ON hospital_departments(cost_center_code);

-- 3. DOCUMENT RUNNING NUMBER RULES TABLE (ระบบกำหนดเลขรันเอกสารทางราชการ)
CREATE TABLE IF NOT EXISTS document_running_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_type_code VARCHAR(32) NOT NULL UNIQUE,      -- รหัสประเภทเอกสาร เช่น PR, PO, REQ, BP, GRN, PV, CPO
    doc_type_name VARCHAR(255) NOT NULL,            -- ชื่อประเภทเอกสาร
    prefix VARCHAR(32) NOT NULL,                    -- คำขึ้นต้น เช่น PR, PO
    format_pattern VARCHAR(128) NOT NULL,           -- รูปแบบ เช่น {PREFIX}-{YEAR}-{NUM} หรือ {PREFIX}-{YEAR}-{DEP}-{NUM}
    year_type VARCHAR(16) NOT NULL DEFAULT 'BE_4',  -- 'BE_4' (2569), 'BE_2' (69), 'AD_4' (2026), 'AD_2' (26)
    padding_digits INT NOT NULL DEFAULT 5,          -- จำนวนหลักเลขรัน เช่น 5 -> 00001
    current_number INT NOT NULL DEFAULT 0,          -- เลขล่าสุดที่ถูกรัน
    reset_policy VARCHAR(16) NOT NULL DEFAULT 'YEARLY', -- 'YEARLY', 'MONTHLY', 'NEVER'
    last_reset_fiscal_year INT DEFAULT 2569,        -- ปีงบประมาณที่รีเซ็ตล่าสุด
    last_reset_month INT DEFAULT 10,                -- เดือนที่รีเซ็ตล่าสุด
    sample_preview VARCHAR(128),                    -- ตัวอย่างเลขรันเพื่อแสดงผล
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. RUNNING NUMBER AUDIT LOG (ประวัติการจ่ายเลขรันเอกสาร ป้องกันเลขกระโดดและตรวจทานได้)
CREATE TABLE IF NOT EXISTS document_running_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_type_code VARCHAR(32) NOT NULL REFERENCES document_running_numbers(doc_type_code) ON DELETE CASCADE,
    allocated_number VARCHAR(128) NOT NULL,
    sequence_value INT NOT NULL,
    fiscal_year INT NOT NULL,
    department_code VARCHAR(32),
    requested_by VARCHAR(255),
    reference_id VARCHAR(128),
    allocated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_running_logs_doc_type ON document_running_logs(doc_type_code);
CREATE INDEX IF NOT EXISTS idx_running_logs_allocated_no ON document_running_logs(allocated_number);

-- 5. ROW-LOCKED ATOMIC SEQUENCE GENERATOR FUNCTION (ฟังก์ชันออกเลขรันแบบปลอดภัยจาก Concurrency)
CREATE OR REPLACE FUNCTION fn_generate_next_doc_number(
    p_doc_type_code VARCHAR(32),
    p_department_code VARCHAR(32) DEFAULT NULL,
    p_actor_name VARCHAR(255) DEFAULT 'SYSTEM'
)
RETURNS VARCHAR(128)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rule RECORD;
    v_next_num INT;
    v_year_str VARCHAR(8);
    v_current_be_year INT;
    v_formatted_num VARCHAR(16);
    v_final_code VARCHAR(128);
    v_now TIMESTAMPTZ := CURRENT_TIMESTAMP;
    v_month INT := EXTRACT(MONTH FROM v_now);
    v_year INT := EXTRACT(YEAR FROM v_now);
BEGIN
    -- คำนวณปีงบประมาณไทย (เริ่ม 1 ต.ค.)
    IF v_month >= 10 THEN
        v_current_be_year := v_year + 543 + 1;
    ELSE
        v_current_be_year := v_year + 543;
    END IF;

    -- ล็อกแถวของ rule นั้นเพื่อป้องกัน race condition ในกรณีที่ส่ง request มาพร้อมกัน
    SELECT * INTO v_rule
    FROM document_running_numbers
    WHERE doc_type_code = p_doc_type_code AND is_active = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active running number rule for doc_type % not found', p_doc_type_code;
    END IF;

    -- ตรวจสอบนโยบายการรีเซ็ตเลขรัน
    IF v_rule.reset_policy = 'YEARLY' AND (v_rule.last_reset_fiscal_year IS NULL OR v_rule.last_reset_fiscal_year < v_current_be_year) THEN
        v_next_num := 1;
        UPDATE document_running_numbers
        SET current_number = 1,
            last_reset_fiscal_year = v_current_be_year,
            last_reset_month = v_month,
            updated_at = v_now
        WHERE doc_type_code = p_doc_type_code;
    ELSE
        v_next_num := v_rule.current_number + 1;
        UPDATE document_running_numbers
        SET current_number = v_next_num,
            updated_at = v_now
        WHERE doc_type_code = p_doc_type_code;
    END IF;

    -- จัดรูปแบบตัวแทนปี
    IF v_rule.year_type = 'BE_4' THEN
        v_year_str := v_current_be_year::TEXT;
    ELSIF v_rule.year_type = 'BE_2' THEN
        v_year_str := SUBSTRING(v_current_be_year::TEXT FROM 3 FOR 2);
    ELSIF v_rule.year_type = 'AD_4' THEN
        v_year_str := v_year::TEXT;
    ELSE
        v_year_str := SUBSTRING(v_year::TEXT FROM 3 FOR 2);
    END IF;

    -- แปลงตัวเลขเป็น Format Padding (เช่น 1 -> "00001")
    v_formatted_num := LPAD(v_next_num::TEXT, v_rule.padding_digits, '0');

    -- ประกอบร่างเลขรันตาม format_pattern
    v_final_code := v_rule.format_pattern;
    v_final_code := REPLACE(v_final_code, '{PREFIX}', v_rule.prefix);
    v_final_code := REPLACE(v_final_code, '{YEAR}', v_year_str);
    v_final_code := REPLACE(v_final_code, '{DEP}', COALESCE(p_department_code, 'CENTRAL'));
    v_final_code := REPLACE(v_final_code, '{NUM}', v_formatted_num);

    -- บันทึกลง Audit Log
    INSERT INTO document_running_logs (
        doc_type_code, allocated_number, sequence_value, fiscal_year, department_code, requested_by
    ) VALUES (
        p_doc_type_code, v_final_code, v_next_num, v_current_be_year, p_department_code, p_actor_name
    );

    RETURN v_final_code;
END;
$$;

-- ============================================================================
-- SEED DATA: GROUPS, DEPARTMENTS & RUNNING NUMBER RULES
-- ============================================================================

-- กลุ่มภารกิจหลักโรงพยาบาลศูนย์ 1,000+ เตียง
INSERT INTO hospital_mission_groups (group_code, group_name_th, group_name_en, display_order)
VALUES
    ('MED', 'กลุ่มภารกิจด้านการแพทย์', 'Medical Services Mission', 1),
    ('NURSE', 'กลุ่มภารกิจด้านการพยาบาล', 'Nursing Services Mission', 2),
    ('PHARMA', 'กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค', 'Pharmacy & Consumer Protection', 3),
    ('TECH_MED', 'กลุ่มภารกิจด้านบริการทางการแพทย์ขั้นสูงและรังสี', 'Advanced Medical Tech & Imaging', 4),
    ('PRIMARY', 'กลุ่มภารกิจด้านบริการปฐมภูมิและเวชกรรมสังคม', 'Primary Care & Social Medicine', 5),
    ('ADMIN', 'กลุ่มภารกิจด้านอำนวยการและยุทธศาสตร์', 'Administrative & Strategy Mission', 6),
    ('ENG', 'กลุ่มงานวิศวกรรมการแพทย์และกายภาพ', 'Biomedical & Facilities Engineering', 7)
ON CONFLICT (group_code) DO NOTHING;

-- แผนก / ศูนย์ต้นทุน (Cost Centers)
INSERT INTO hospital_departments (department_code, group_code, department_name_th, department_name_en, cost_center_code, head_name, telephone, location_building, floor_number)
VALUES
    ('DEP-MED-OPD', 'MED', 'แผนกตรวจโรคผู้ป่วยนอกอายุรกรรม (OPD Med)', 'Outpatient Internal Medicine', 'CC-10670-101', 'นพ. วิศรุต วัฒนเวชากุล', '02-590-1011', 'อาคารเฉลิมพระเกียรติ', 'ชั้น 2'),
    ('DEP-SURG-OR', 'MED', 'ศูนย์ห้องผ่าตัดกลาง (Central OR Suite)', 'Central Operating Rooms', 'CC-10670-102', 'พญ. พรพิมล อริยสัจจะ', '02-590-1022', 'อาคารศูนย์การแพทย์ขั้นสูง', 'ชั้น 4'),
    ('DEP-ICU-MED', 'NURSE', 'หออภิบาลผู้ป่วยหนักอายุรกรรม (Medical ICU)', 'Medical Intensive Care Unit', 'CC-10670-201', 'พว. มัลลิกา เจริญกิจ (APN)', '02-590-2011', 'อาคารอุบัติเหตุ 80 พรรษา', 'ชั้น 3'),
    ('DEP-ER-TRAUMA', 'MED', 'ศูนย์อุบัติเหตุและฉุกเฉินระดับ 1 (Level 1 Trauma ER)', 'Emergency & Trauma Center', 'CC-10670-103', 'นพ. กิตติภพ เตชะมนต์', '02-590-1033', 'อาคารอุบัติเหตุ 80 พรรษา', 'ชั้น 1'),
    ('DEP-PHARM-CENTRAL', 'PHARMA', 'คลังยากลางและเวชภัณฑ์มิใช่ยา', 'Central Pharmacy Stock & Supply', 'CC-10670-301', 'ภก. ชัยวัฒน์ เกียรติอนันต์', '02-590-3011', 'อาคารคลังพัสดุและเภสัชกรรม', 'ชั้น 1'),
    ('DEP-PHARM-IPD', 'PHARMA', 'ห้องจ่ายยาผู้ป่วยในและตู้ยาประจำวอร์ด', 'Inpatient Dispensing & Ward Stocks', 'CC-10670-302', 'ภญ. รัตนาวลัย ทรัพย์มั่งมี', '02-590-3022', 'อาคารเฉลิมพระเกียรติ', 'ชั้น 3'),
    ('DEP-XRAY-CT', 'TECH_MED', 'กลุ่มงานรังสีวินิจฉัยและเอกซเรย์คอมพิวเตอร์ (CT/MRI)', 'Diagnostic Radiology & CT/MRI', 'CC-10670-401', 'นพ. สุรเชษฐ์ เจษฎาภา', '02-590-4011', 'อาคารเฉลิมพระเกียรติ', 'ชั้น 1'),
    ('DEP-LAB-PATH', 'TECH_MED', 'กลุ่มงานเทคนิคการแพทย์และพยาธิวิทยาคลินิก', 'Clinical Pathology & Laboratory', 'CC-10670-402', 'ทนพญ. นงนุช โสภณพนิช', '02-590-4022', 'อาคารศูนย์การแพทย์ขั้นสูง', 'ชั้น 2'),
    ('DEP-SUPPLY-PROC', 'ADMIN', 'กลุ่มงานพัสดุและจัดซื้อจัดจ้างภาครัฐ', 'Procurement & Supply Division', 'CC-10670-601', 'นางสมศรี รัตนเวโรจน์ (นวพ.ชำนาญการ)', '02-590-6011', 'อาคารอำนวยการ', 'ชั้น 2'),
    ('DEP-FIN-DISB', 'ADMIN', 'กลุ่มงานการเงินและเบิกจ่ายคลัง (3-Way Match)', 'Finance & Disbursement Division', 'CC-10670-602', 'น.ส. นิตยา สิริโภคา (นวบ.ชำนาญการพิเศษ)', '02-590-6022', 'อาคารอำนวยการ', 'ชั้น 2'),
    ('DEP-STRAT-PLAN', 'ADMIN', 'กลุ่มงานยุทธศาสตร์และแผนงานพหุกองทุน', 'Strategy & Multi-Fund Planning', 'CC-10670-603', 'ดร. ธนพล มโนรมย์', '02-590-6033', 'อาคารอำนวยการ', 'ชั้น 3'),
    ('DEP-ENG-BIOMED', 'ENG', 'กลุ่มงานวิศวกรรมการแพทย์และบำรุงรักษาครุภัณฑ์', 'Biomedical Engineering & Maintenance', 'CC-10670-701', 'วศ. เกรียงศักดิ์ วงศ์สวัสดิ์', '02-590-7011', 'อาคารวิศวกรรมการแพทย์', 'ชั้น 1')
ON CONFLICT (department_code) DO NOTHING;

-- กฎการออกเลขรันเอกสารราชการ (Document Running Number Configuration)
INSERT INTO document_running_numbers (doc_type_code, doc_type_name, prefix, format_pattern, year_type, padding_digits, current_number, reset_policy, last_reset_fiscal_year, sample_preview, description)
VALUES
    ('PR', 'ใบขอซื้อ/ขอจ้างยาและเวชภัณฑ์ (Purchase Requisition)', 'PR', '{PREFIX}-{YEAR}-{DEP}-{NUM}', 'BE_4', 5, 128, 'YEARLY', 2569, 'PR-2569-MED-00128', 'ใบขอซื้อพัสดุ/ยาตามระเบียบคลัง แยกหมวดตามหน่วยเบิก'),
    ('PO', 'ใบสั่งซื้อ/สั่งจ้างราชการ (Purchase Order)', 'PO', '{PREFIX}-{YEAR}-{NUM}', 'BE_4', 5, 84, 'YEARLY', 2569, 'PO-2569-00084', 'ใบสั่งซื้อพัสดุหรือยาที่ผ่านการอนุมัติวงเงินผูกพัน'),
    ('REQ', 'ใบเบิกยาและเวชภัณฑ์คลังย่อยวอร์ด (Ward Requisition FEFO)', 'REQ', '{PREFIX}-{YEAR}-{NUM}', 'BE_4', 5, 345, 'YEARLY', 2569, 'REQ-2569-00345', 'ใบเบิกยาจากตู้ยาวอร์ดเข้าคลังยากลางเพื่อตัดจ่าย FEFO'),
    ('BP', 'คำของบประมาณรายจ่ายประจำปี (Annual Budget Proposal)', 'BP', '{PREFIX}-{YEAR}-{NUM}', 'BE_2', 3, 4, 'YEARLY', 2570, 'BP-70-004', 'คำขอตั้งงบประมาณรายจ่ายล่วงหน้าระดับกลุ่มภารกิจ'),
    ('GRN', 'ใบตรวจรับพัสดุและยาควบคุมความเย็น (Goods Receipt Note)', 'GRN', '{PREFIX}-{YEAR}-{NUM}', 'BE_4', 5, 62, 'YEARLY', 2569, 'GRN-2569-00062', 'ใบตรวจรับพัสดุพร้อมแนบผลบันทึกอุณหภูมิ Cold-Chain'),
    ('PV', 'ใบสำคัญจ่ายเงินและคำสั่งโอน GFMIS (Payment Voucher)', 'PV', '{PREFIX}-{YEAR}-{NUM}', 'BE_4', 5, 51, 'YEARLY', 2569, 'PV-2569-00051', 'ใบสำคัญจ่ายที่ผ่านการตรวจสอบ 3-Way Match และหักภาษี'),
    ('CPO', 'ใบสั่งซื้อเวชภัณฑ์ห้องผ่าตัดฝากขาย Auto-PO (Consignment PO)', 'CPO', '{PREFIX}-{YEAR}-{NUM}', 'BE_4', 4, 19, 'YEARLY', 2569, 'CPO-2569-0019', 'ใบสั่งซื้อตัดยอดฝากขายอัตโนมัติสรุปสิ้นงวดของห้องผ่าตัด'),
    ('CN', 'สัญญาจะซื้อจะขายและสัญญาจ้างมาตรฐาน (Contract Agreement)', 'CN', '{PREFIX}-{YEAR}-{NUM}', 'BE_4', 4, 12, 'YEARLY', 2569, 'CN-2569-0012', 'สัญญาจัดซื้อจัดจ้างที่ผ่านการตรวจสอบจากนิติกร')
ON CONFLICT (doc_type_code) DO NOTHING;

COMMIT;
