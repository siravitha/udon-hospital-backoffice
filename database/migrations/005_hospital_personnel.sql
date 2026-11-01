-- ============================================================================
-- MIGRATION 005: HOSPITAL PERSONNEL & STAFF DIRECTORY
-- SYSTEM: HOS-BACKOFFICE ENTERPRISE (LARGE PUBLIC HOSPITAL 1,000+ BEDS, HCODE: 10670)
-- SPECIFICATION: THAI PUBLIC PROCUREMENT ACT B.E. 2560 & MOPH PROVIDER ID 2FA
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS hospital_personnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_code VARCHAR(32) NOT NULL UNIQUE,          -- รหัสบุคลากร เช่น EMP-10670-001 หรือ DOC-001
    citizen_id VARCHAR(13) NOT NULL,                 -- เลขบัตร ปชช. 13 หลัก (คุ้มครองตาม PDPA)
    moph_provider_id VARCHAR(64) UNIQUE,             -- MOPH Provider ID สำหรับ 2FA & PAdES Signature
    title_th VARCHAR(32) NOT NULL,                   -- คำนำหน้าชื่อ (นพ., พญ., ภก., ภญ., พว., ทนพ., นวพ., นาย, นาง, น.ส.)
    first_name_th VARCHAR(128) NOT NULL,
    last_name_th VARCHAR(128) NOT NULL,
    first_name_en VARCHAR(128),
    last_name_en VARCHAR(128),
    personnel_type VARCHAR(32) NOT NULL,             -- 'PHYSICIAN', 'NURSE', 'PHARMACIST', 'TECH_MED', 'PROCUREMENT_OFFICER', 'FINANCE_OFFICER', 'LEGAL_OFFICER', 'EXECUTIVE', 'ENGINEER', 'STAFF'
    position_title VARCHAR(255) NOT NULL,            -- ตำแหน่งทางราชการ เช่น นายแพทย์ชำนาญการพิเศษ, เภสัชกรเชี่ยวชาญ
    department_code VARCHAR(32) REFERENCES hospital_departments(department_code) ON DELETE RESTRICT,
    license_number VARCHAR(64),                      -- เลขที่ใบประกอบวิชาชีพเวชกรรม/เภสัชกรรม/การพยาบาล
    email VARCHAR(128),
    telephone VARCHAR(64),
    is_committee_eligible BOOLEAN DEFAULT TRUE,      -- คุณสมบัติเป็นกรรมการจัดซื้อ/ตรวจรับพัสดุตาม พ.ร.บ. 2560
    pades_signature_active BOOLEAN DEFAULT TRUE,     -- ลงนามดิจิทัล PAdES-LTV ได้
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_personnel_staff_code ON hospital_personnel(staff_code);
CREATE INDEX IF NOT EXISTS idx_personnel_type ON hospital_personnel(personnel_type);
CREATE INDEX IF NOT EXISTS idx_personnel_dep ON hospital_personnel(department_code);
CREATE INDEX IF NOT EXISTS idx_personnel_moph ON hospital_personnel(moph_provider_id);

-- เพิ่มรูปแบบเลขรันสำหรับออกรหัสเจ้าหน้าที่ใหม่ (EMP)
INSERT INTO document_running_numbers (doc_type_code, doc_type_name, prefix, format_pattern, year_type, padding_digits, current_number, reset_policy, last_reset_fiscal_year, sample_preview, description)
VALUES
    ('EMP', 'รหัสประจำตัวบุคลากรโรงพยาบาล (Hospital Staff ID)', 'EMP', '{PREFIX}-10670-{NUM}', 'BE_4', 4, 15, 'NEVER', 2569, 'EMP-10670-0016', 'รหัสประจำตัวข้าราชการ/พนักงานกระทรวงสาธารณสุข รันต่อเนื่องตลอดไป')
ON CONFLICT (doc_type_code) DO NOTHING;

-- SEED DATA: 15 REALISTIC HOSPITAL PERSONNEL
INSERT INTO hospital_personnel (
    staff_code, citizen_id, moph_provider_id, title_th, first_name_th, last_name_th,
    first_name_en, last_name_en, personnel_type, position_title, department_code,
    license_number, email, telephone, is_committee_eligible, pades_signature_active
) VALUES
    ('EMP-10670-0001', '1100200345671', 'MOPH-10670-DIR01', 'นพ.', 'เกียรติภูมิ', 'วงศ์สว่าง', 'Kiatiphum', 'Wongsawang', 'EXECUTIVE', 'ผู้อำนวยการโรงพยาบาลศูนย์ (นายแพทย์ทรงคุณวุฒิ)', 'DEP-STRAT-PLAN', 'ว. 28941', 'director@hospital10670.moph.go.th', '02-590-1001', true, true),
    ('EMP-10670-0002', '1100200345672', 'MOPH-10670-MED01', 'นพ.', 'วิศรุต', 'วัฒนเวชากุล', 'Wisarut', 'Wattanavejakul', 'PHYSICIAN', 'หัวหน้ากลุ่มภารกิจด้านการแพทย์ (นายแพทย์เชี่ยวชาญ)', 'DEP-MED-OPD', 'ว. 34512', 'wisarut.w@hospital10670.moph.go.th', '02-590-1011', true, true),
    ('EMP-10670-0003', '1100200345673', 'MOPH-10670-SURG01', 'พญ.', 'พรพิมล', 'อริยสัจจะ', 'Pornpimon', 'Ariyasajja', 'PHYSICIAN', 'หัวหน้าศูนย์ห้องผ่าตัดกลาง (ศัลยแพทย์ทรวงอก ชำนาญการพิเศษ)', 'DEP-SURG-OR', 'ว. 41209', 'pornpimon.a@hospital10670.moph.go.th', '02-590-1022', true, true),
    ('EMP-10670-0004', '1100200345674', 'MOPH-10670-ER01', 'นพ.', 'กิตติภพ', 'เตชะมนต์', 'Kittiphop', 'Techamon', 'PHYSICIAN', 'หัวหน้าศูนย์อุบัติเหตุและฉุกเฉิน (เวชศาสตร์ฉุกเฉิน ชำนาญการพิเศษ)', 'DEP-ER-TRAUMA', 'ว. 45678', 'kittiphop.t@hospital10670.moph.go.th', '02-590-1033', true, true),
    ('EMP-10670-0005', '1100200345675', 'MOPH-10670-NUR01', 'พว.', 'มัลลิกา', 'เจริญกิจ', 'Mallika', 'Charoenkit', 'NURSE', 'หัวหน้าหออภิบาลผู้ป่วยหนัก ICU (พยาบาลวิชาชีพชำนาญการพิเศษ/APN)', 'DEP-ICU-MED', 'พ. 589124', 'mallika.c@hospital10670.moph.go.th', '02-590-2011', true, true),
    ('EMP-10670-0006', '1100200345676', 'MOPH-10670-PHA01', 'ภก.', 'ชัยวัฒน์', 'เกียรติอนันต์', 'Chaiwat', 'Kiat-anan', 'PHARMACIST', 'หัวหน้ากลุ่มงานเภสัชกรรม (เภสัชกรเชี่ยวชาญ)', 'DEP-PHARM-CENTRAL', 'ภ. 19283', 'chaiwat.k@hospital10670.moph.go.th', '02-590-3011', true, true),
    ('EMP-10670-0007', '1100200345677', 'MOPH-10670-PHA02', 'ภญ.', 'รัตนาวลัย', 'ทรัพย์มั่งมี', 'Rattanawalai', 'Submangmee', 'PHARMACIST', 'เภสัชกรประจำห้องจ่ายยาผู้ป่วยใน (เภสัชกรชำนาญการ)', 'DEP-PHARM-IPD', 'ภ. 23410', 'rattanawalai.s@hospital10670.moph.go.th', '02-590-3022', true, true),
    ('EMP-10670-0008', '1100200345678', 'MOPH-10670-XRAY01', 'นพ.', 'สุรเชษฐ์', 'เจษฎาภา', 'Surachet', 'Jessadapa', 'PHYSICIAN', 'หัวหน้ากลุ่มงานรังสีวินิจฉัย (รังสีแพทย์ ชำนาญการพิเศษ)', 'DEP-XRAY-CT', 'ว. 38921', 'surachet.j@hospital10670.moph.go.th', '02-590-4011', true, true),
    ('EMP-10670-0009', '1100200345679', 'MOPH-10670-LAB01', 'ทนพญ.', 'นงนุช', 'โสภณพนิช', 'Nongnuch', 'Sophonpanich', 'TECH_MED', 'หัวหน้ากลุ่มงานเทคนิคการแพทย์ (นักเทคนิคการแพทย์เชี่ยวชาญ)', 'DEP-LAB-PATH', 'ทนพ. 7821', 'nongnuch.s@hospital10670.moph.go.th', '02-590-4022', true, true),
    ('EMP-10670-0010', '1100200345680', 'MOPH-10670-PROC01', 'นาง', 'สมศรี', 'รัตนเวโรจน์', 'Somsri', 'Rattanaweroj', 'PROCUREMENT_OFFICER', 'หัวหน้ากลุ่มงานพัสดุและจัดซื้อจัดจ้าง (นักวิชาการพัสดุชำนาญการพิเศษ)', 'DEP-SUPPLY-PROC', NULL, 'somsri.r@hospital10670.moph.go.th', '02-590-6011', false, true),
    ('EMP-10670-0011', '1100200345681', 'MOPH-10670-FIN01', 'น.ส.', 'นิตยา', 'สิริโภคา', 'Nittaya', 'Siriphoka', 'FINANCE_OFFICER', 'หัวหน้ากลุ่มงานการเงินและเบิกจ่าย (นักวิชาการเงินและบัญชีชำนาญการพิเศษ)', 'DEP-FIN-DISB', NULL, 'nittaya.s@hospital10670.moph.go.th', '02-590-6022', false, true),
    ('EMP-10670-0012', '1100200345682', 'MOPH-10670-LEG01', 'นาย', 'ธนิต', 'นิติกิตติ', 'Thanit', 'Nitikitti', 'LEGAL_OFFICER', 'นิติกรตรวจร่างสัญญาและหลักประกัน e-LG (นิติกรปฏิบัติการ)', 'DEP-SUPPLY-PROC', NULL, 'thanit.n@hospital10670.moph.go.th', '02-590-6015', true, true),
    ('EMP-10670-0013', '1100200345683', 'MOPH-10670-ENG01', 'วศ.', 'เกรียงศักดิ์', 'วงศ์สวัสดิ์', 'Kriangsak', 'Wongsawat', 'ENGINEER', 'หัวหน้ากลุ่มงานวิศวกรรมการแพทย์ (วิศวกรชีวการแพทย์ชำนาญการ)', 'DEP-ENG-BIOMED', 'กว. 89124', 'kriangsak.w@hospital10670.moph.go.th', '02-590-7011', true, true),
    ('EMP-10670-0014', '1100200345684', 'MOPH-10670-PLAN01', 'ดร.', 'ธนพล', 'มโนรมย์', 'Thanaphon', 'Manorom', 'EXECUTIVE', 'หัวหน้ากลุ่มงานยุทธศาสตร์และแผนงานพหุกองทุน (นักวิเคราะห์นโยบายและแผนเชี่ยวชาญ)', 'DEP-STRAT-PLAN', NULL, 'thanaphon.m@hospital10670.moph.go.th', '02-590-6033', true, true),
    ('EMP-10670-0015', '1100200345685', 'MOPH-10670-NUR02', 'พว.', 'จันทิมา', 'บวรศิลป์', 'Chanthima', 'Bawornsilp', 'NURSE', 'พยาบาลหัวหน้าเวรห้องผ่าตัด OR (พยาบาลวิชาชีพชำนาญการ)', 'DEP-SURG-OR', 'พ. 612890', 'chanthima.b@hospital10670.moph.go.th', '02-590-1025', true, true)
ON CONFLICT (staff_code) DO NOTHING;

COMMIT;
