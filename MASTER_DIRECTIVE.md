# 🏛️🏥 ALL-IN-ONE MASTER DIRECTIVE v4.6 (LARGE HOSPITAL ENTERPRISE — TEAM SPAWN & EXECUTION FIRST)
**เรียน:** `@ProductOwner` (Lead PM & Hospital Project Orchestrator) และ `@chief-of-staff`  
**โปรเจกต์ใน Agentroom:** `HOS-BACKOFFICE` (`C:\HOS-BACKOFFICE`)  
**บริบทหน่วยงาน:** โรงพยาบาลรัฐขนาดใหญ่ (โรงพยาบาลศูนย์ / โรงพยาบาลมหาวิทยาลัย / โรงพยาบาลตติยภูมิขนาด 1,000+ เตียง)  

---

## 🚨 คำสั่งบังคับลำดับที่ 1 (PRIORITY 0: สร้างทีมผู้เชี่ยวชาญ + กำหนด Model ตามความถนัด + แจกจ่ายงานให้เริ่มทำทันที)

> **[คำอนุมัติล่วงหน้าจากผู้บังคับบัญชา - PRE-AUTHORIZED BY USER]:**  
> ผู้ใช้ **อนุมัติอย่างเป็นทางการแล้ว 100%** ให้ `@ProductOwner` และ `@chief-of-staff` ทำการ **Spawn / สร้าง / เปิดใช้งาน Agent ผู้เชี่ยวชาญครบทุกตำแหน่งทันทีโดยไม่ต้องหยุดถามขออนุมัติซ้ำ** ห้ามรอและห้ามตั้งสถานะ `waiting_input` สำหรับการสร้างทีมเด็ดขาด!

### ขั้นตอนที่ 1.1: สร้างทีมผู้เชี่ยวชาญ (Save & Spawn Specialist Agents) และกำหนด Model บนเครื่อง MSI DGX (`192.168.1.224:11434`) ตามความเชี่ยวชาญ
ให้ `@ProductOwner` / `@chief-of-staff` เรียกใช้เครื่องมือ MCP ของ AgentsRoom (**`mcp__AgentsRoom-MCP__agents_save`** เพื่อบันทึก Agent ลงแถบ Sidebar ของโปรเจกต์ `HOS-BACKOFFICE` อย่างถาวร และ **`mcp__AgentsRoom-MCP__agents_spawn`** เพื่อเปิดแท็บรันงาน) ให้ครบทั้ง **5 สายงานหลัก** โดยตั้งค่า `provider: "ollama:claude"` และใช้ **Model ที่ตรงกับความเก่งและเชี่ยวชาญเฉพาะด้าน** ดังตารางบังคับนี้:

| ลำดับ | ชื่อ Agent ที่ต้องสร้าง | Role ใน AgentsRoom | Model ที่ต้องใช้ (ความเชี่ยวชาญเฉพาะทาง) | ชื่อสำรอง (กรณีระบบจำกัดชื่อ) | เหตุผลและความเก่งของ Model |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **0** | **`@chief-of-staff`** | `chief-of-staff` | **`dgx-qwen3.8:27b`** | `qwen3.8:latest` / `sonnet` | มีระบบ Thinking + Tools ประสานงานข้ามสายงานและเป็นกรรมการตัดสิน (Seam Referee) ได้แม่นยำ |
| **1** | **`@ProductOwner`** | `pm` | **`dgx-qwen3.8:27b`** | `qwen3.8:latest` / `sonnet[1m]` | เก่งการวางแผนโครงการ คุม Master State Machine แตกใบงาน และตรวจความถูกต้องของตัวเลขการเงิน |
| **2** | **`@Architect`** | `architect` | **`dgx-deepseek-r1:32b`** | `deepseek-r1:32b` | **เก่ง Deep Reasoning 32.8B สูงสุด** เหมาะกับการออกแบบโครงสร้าง C4 Diagram, Data Flow และสถาปัตยกรรมระบบ |
| **3** | **`@DatabaseEngineer`** | `backend` *(Database)* | **`dgx-qwen2.5-coder:32b`** | `qwen2.5-coder:32b` | **เก่ง SQL & Database Architecture สูงสุด** แม่นยำในการเขียน PostgreSQL 15+ DDL, PL/pgSQL Triggers, Locks และ RLS |
| **4** | **`@BackendDeveloper`** | `backend` *(API & Engines)* | **`dgx-qwen2.5-coder:32b`** / **`dgx-qwen3-coder:30b`** | `qwen2.5-coder:32b` | **เก่ง Backend Services, REST/RPC APIs & Business Logic** พัฒนา MOPH Provider ID 2FA Auth, 3 Domain Engines และ Redis Cache |
| **5** | **`@FrontendDeveloper`** | `frontend` | **`dgx-qwen3-coder:30b`** | `qwen3-coder:30b` | **เก่ง Modern Frontend (MoE 30.5B) สูงสุด** เชี่ยวชาญ Next.js 15 App Router, TypeScript, Tailwind CSS และ Complex UI |
| **6** | **`@SecurityLead`** | `security` | **`dgx-deepseek-r1:32b`** | `deepseek-r1:32b` | **เก่งการคิดวิเคราะห์ช่องโหว่เชิงลึก (Deep Reasoning)** เหมาะกับการทำ STRIDE Threat Modeling, Hash Chain, PAdES-LTV และ PDPA |
| *(เสริม)* | **`@HospitalUXDoc`** | `custom` | **`dgx-gemma3:27b`** / **`dgx-qwen2.5:32b`** | `gemma3:27b` / `opus` | `dgx-gemma3:27b` เชี่ยวชาญการดูภาพ/UI และ `dgx-qwen2.5:32b` เชี่ยวชาญการร่างเอกสารและสัญญาราชการภาษาไทย |

### ขั้นตอนที่ 1.2: แจกจ่ายงาน (Dispatch Tasks) และบังคับให้แต่ละ Agent สร้างไฟล์ผลงานจริงลงดิสก์ทันที
เมื่อสร้างทีมครบแล้ว ให้ `@ProductOwner` แจกจ่ายงานทั้ง **5 Track** ทันที โดย **ห้ามเปลี่ยนสถานะใบงานเป็น `done` จนกว่า Agent ตัวนั้นจะเขียนไฟล์ผลงานจริงลงในโฟลเดอร์ `C:\HOS-BACKOFFICE` ตามพาธบังคับนี้ และ `@ProductOwner` ใช้คำสั่งอ่านไฟล์ตรวจสอบแล้วว่าไฟล์มีอยู่จริงและเนื้อหาสมบูรณ์** (หมายเหตุ: โมเดล 30B-32B บน MSI DGX อาจใช้เวลาประมวลผลและสลับคิว VRAM 5-15 นาทีต่อใบงาน ห้ามตัดจบใบงานก่อนไฟล์ถูกสร้างเด็ดขาด):

1. **สั่งการ `@Architect` (ใช้ `dgx-deepseek-r1:32b` — Ticket #2):**
   - ต้องสร้างไฟล์จริงที่: `C:\HOS-BACKOFFICE\docs\architecture\hospital-architecture.md`
   - เนื้อหาต้องครบ: C4 Container Diagram, Cross-Department Data Flow ข้าม 6 ฝ่ายโรงพยาบาล, **สถาปัตยกรรมการยืนยันตัวตน 2 ระบบ (Local Username/Password + 2FA ผ่านระบบ Provider ID ของกระทรวงสาธารณสุข OAuth2/OIDC)**, การเชื่อมต่อ HIS / DMS / MEMS / e-GP / e-LG / GFMIS, สถาปัตยกรรม Redis + Materialized View `< 50ms`, และสเปก 3 Domain Engines (Standstill & Penalty Engine, Blanket PA & OR Consignment Engine, Warranty/MA/Calibration Engine)
2. **สั่งการ `@DatabaseEngineer` (ใช้ `dgx-qwen2.5-coder:32b` — Ticket #3):**
   - ต้องสร้างไฟล์ SQL จริงที่: `C:\HOS-BACKOFFICE\db\migrations\001_hospital_eprocurement_schema.sql`
   - เนื้อหาต้องครบ: PostgreSQL 15+ DDL ครบทุกตารางของโรงพยาบาล (รวมตาราง `users_and_moph_providers` เก็บ `username`, `password_hash` Argon2id, `moph_provider_id`, `hcode`, `council_code`, `two_factor_verified_at` และ `auth_sessions_audit`, ใช้ `UUID` PK, `NUMERIC(15,2)` ยอดสุทธิ, `NUMERIC(18,4)` ราคาต่อหน่วยและฐาน Ex-VAT, `version INT NOT NULL DEFAULT 1`), PL/pgSQL Triggers (`trg_budget_encumbrance_sync` ใช้ `SELECT ... FOR UPDATE ORDER BY budget_id ASC`, `trg_disbursement_gl_sync`), ฟังก์ชันตรวจจับทุจริต (`fn_detect_hospital_procurement_anomalies`), Materialized View `mv_executive_dashboard_kpis`, และ Row-Level Security (RLS)
3. **สั่งการ `@BackendDeveloper` (ใช้ `dgx-qwen2.5-coder:32b` — Ticket #4):**
   - ต้องสร้างไฟล์โค้ด Backend Services & API จริงใน: `C:\HOS-BACKOFFICE\src\server\` และ `C:\HOS-BACKOFFICE\src\app\api\`
   - เนื้อหาต้องครบ:
     - **ระบบยืนยันตัวตน 2 ชั้น (`src/server/auth/`):** (1) Local Username/Password (`Argon2id` verification + Rate Limit + Lockout) และ (2) OAuth 2.0 / OIDC (PKCE) เชื่อมต่อ **MOPH Health ID & Provider ID ของกระทรวงสาธารณสุข** ตรวจ `hcode` 5 หลักและบังคับ Step-Up 2FA Token ก่อนอนุมัติงบ/ลงนาม PAdES/เบิกจ่าย
     - **3 Core Hospital Domain Engines (`src/server/engines/`):** `standstill-penalty.engine.ts` (นับ 7 วันทำการข้ามวันหยุดราชการ + หักวันตรวจรับออกจากวันปรับ), `blanket-consignment.engine.ts` (ตัดโควตาสัญญาจะซื้อจะขายยา PA + รับ Webhook ยอดใช้เวชภัณฑ์ฝากขายห้องผ่าตัดจาก HIS ด้วย `Idempotency-Key`), และ `3way-match-tax.engine.ts` (คำนวณถอด VAT 7%, WHT 1% จากฐาน Ex-VAT ยกเว้น GPO, หักค่าปรับ, และคำนวณ `Net Payable = Incl-VAT - WHT - Penalty`)
     - **API Route Handlers (`src/app/api/`):** `/api/auth/login`, `/api/auth/moph-provider-callback`, `/api/dashboard/kpis/route.ts` (Redis Cache + Materialized View `< 50ms`), `/api/procurement/pr`, `/api/disbursement/3way-match`
4. **สั่งการ `@FrontendDeveloper` (ใช้ `dgx-qwen3-coder:30b` — Ticket #5):**
   - ต้องสร้างไฟล์โค้ด UI จริงใน: `C:\HOS-BACKOFFICE\src\app\` และ `C:\HOS-BACKOFFICE\src\components\` (ประกอบด้วย Design System, หน้าจอ `/login` แบบ **2-Step Authentication: ขั้นที่ 1 Username/Password + ขั้นที่ 2 ยืนยัน 2FA ด้วยปุ่ม MOPH Provider ID กระทรวงสาธารณสุข**, 7 Routes `/dashboard`, `/workspace/[role]`, `/auditor`, 8 Core Components `<MophProviderId2FAModal />`, `<MultiFundAbsorptionBar />`, `<BlanketQuotaTracker />`, `<ConsignmentUsageCard />`, `<StandstillTimerBadge />`, `<PharmaInspectionModal />`, `<ThreeWayMatchCard />`, `<DiffViewer />`)
5. **สั่งการ `@SecurityLead` (ใช้ `dgx-deepseek-r1:32b` — Ticket #6):**
   - ต้องสร้างไฟล์จริงที่: `C:\HOS-BACKOFFICE\docs\security\security-forensics-spec.md`
   - เนื้อหาต้องครบ: STRIDE Threat Modeling, **สเปกความปลอดภัยระบบ Login 2 ชั้น (Argon2id Password Hashing + OAuth2/OIDC PKCE เชื่อมต่อ Health ID / Provider ID ของ สธ. ตรวจสอบ `hcode` สถานพยาบาล และ Step-Up 2FA ก่อนอนุมัติงบ/ลงนาม PAdES/เบิกจ่าย)**, โครงสร้าง Partitioned SHA-256 Hash Chaining + Daily Merkle Tree Root บน `system_audit_logs`, สเปก PAdES-LTV & RFC 3161 Timestamping, การควบคุม `EMERGENCY_RETROSPECTIVE_PR`, และ Zero-Trust Read-Only + PDPA Anonymization สำหรับ สตง./ป.ป.ช.

---

## 📋 2. รายละเอียดคำสั่งมอบหมายงานรายตำแหน่งอย่างละเอียด (Detailed Agent Assignments)

### 🎯 [ภารกิจของ `@ProductOwner` (PM — ใช้ `dgx-qwen3.8:27b`)]
1. **สร้างทีมและปลุก Agent ทั้ง 4 ตำแหน่งให้เริ่มทำงานทันที** ตามขั้นตอนที่ 1.1 และ 1.2
2. จัดทำและควบคุม **Master Charter & Canonical State Machines (`SM-1` ถึง `SM-6`)** โดยบังคับให้ทุกฝ่ายใช้ชื่อสถานะตรงกัน 100% (ใช้คำสะกด `PRE_ENCUMBERED` เท่านั้น ห้ามสะกดผิดเป็น `PRE_ENCOMBERED`)
3. กำหนด **Delegation of Authority Matrix (ตารางอำนาจอนุมัติตามวงเงินและแหล่งเงินของโรงพยาบาล)**
4. กำหนด **Shared-Fixture Math Check (โจทย์ทดสอบความตรงกันของตัวเลขการเงินระหว่าง DB และ Frontend):**
   - ใบสำคัญตั้งเบิกรวม VAT 7% (`Incl-VAT`) = **`1,070,000.00` บาท**
   - ถอดฐานมูลค่าก่อนภาษี (`Ex-VAT`) = **`1,000,000.00` บาท** (ภาษีมูลค่าเพิ่ม VAT 7% = `70,000.00` บาท)
   - หักภาษี ณ ที่จ่าย 1% (`WHT 1%` คิดจากฐาน `Ex-VAT 1,000,000.00`) = **`10,000.00` บาท**
   - หักค่าปรับส่งมอบล่าช้า (`Penalty`) = **`50,000.00` บาท**
   - **ยอดเงินโอนสุทธิเข้าบัญชีผู้ขาย (`Net Payable`)** = `1,070,000.00 - 10,000.00 - 50,000.00` = **`1,010,000.00` บาท** *(ทั้ง `@DatabaseEngineer` และ `@FrontendDeveloper` ต้องคำนวณได้ `1,010,000.00` บาทตรงกันเป๊ะ)*
5. เมื่อทั้ง 4 ฝ่ายสร้างไฟล์ลงดิสก์เสร็จสิ้น ให้ดำเนินการทำ **Cross-Agent Verification** ตรวจสอบความสอดคล้องข้ามสายงานอย่างละเอียด

### 🎯 [ภารกิจของ `@Architect` (Principal Healthcare & GovTech Architect — ใช้ `dgx-deepseek-r1:32b`)]
1. ออกแบบ **C4 Container Diagram & Cross-Department Data Flow** ข้าม 6 ฝ่ายหลักของโรงพยาบาล พร้อมจุดเชื่อมต่อระบบภายนอก (**MOPH Health ID / Provider ID (OAuth2/OIDC 2FA), HIS, DMS คลังยา, MEMS วิศวกรรมทางการแพทย์, e-GP, e-LG ธนาคาร, และ GFMIS**)
2. ออกแบบระบบ **Caching Layer (Redis + PostgreSQL Materialized View)** สำหรับหน้า Executive & Cash Flow Dashboard ให้ได้ Response Time `< 50ms` พร้อมกำหนด JSON Schema ของ KPI Payload ให้ `@FrontendDeveloper` นำไปใช้
3. ออกแบบ **3 Core Hospital Domain Engines**:
   - **Holiday-Aware Standstill & Penalty Engine:** คำนวณระยะเวลารออุทธรณ์ 7 วันทำการ (ข้ามวันหยุดราชการและวันหยุดพิเศษ ครม.) และคำนวณวันปรับสุทธิโดยหักวันตรวจรับของคณะกรรมการออก
   - **Blanket PA & OR Consignment Engine:** กลไกตัดโควตาสัญญาจะซื้อจะขายยา และการแปลงยอดใช้เวชภัณฑ์ฝากขายจากห้องผ่าตัด (HIS) มาเป็นใบตรวจรับ/PO อัตโนมัติพร้อม `Idempotency-Key`
   - **Warranty, MA & Calibration Alert Engine:** แจ้งเตือนคืนหลักประกันล่วงหน้า 30 วัน, แจ้งเตือนต่อสัญญา MA เครื่องมือแพทย์ล่วงหน้า 90 วัน, และแจ้งเตือนรอบสอบเทียบเครื่องมือแพทย์ตามมาตรฐาน HA

### 🎯 [ภารกิจของ `@DatabaseEngineer` (Lead PostgreSQL Architect — ใช้ `dgx-qwen2.5-coder:32b`)]
1. จัดทำโครงสร้างและสคริปต์ **PostgreSQL 15+ Production DDL** ครอบคลุมตารางหลักของโรงพยาบาล โดยใช้ `UUID` เป็น Primary Key, `NUMERIC(15, 2)` สำหรับยอดเงินสุทธิ, `NUMERIC(18, 4)` สำหรับราคาต่อหน่วยของยา/เวชภัณฑ์และฐานคำนวณภาษี Ex-VAT, และ `version INT NOT NULL DEFAULT 1` ในทุกตาราง:
   - ตารางกลุ่มผู้ใช้งานและการยืนยันตัวตน 2 ชั้น (MOPH Provider ID 2FA): `users_and_moph_providers` (เก็บ `username`, `password_hash` Argon2id, `moph_provider_id`, `hcode` 5 หลัก, `council_code`, `two_factor_verified_at`), และ `auth_sessions_audit`
   - ตารางกลุ่มงบประมาณและแผน: `departments_cost_centers`, `gov_holiday_calendar`, `hospital_funds_budgets` (5 สถานะวงเงิน: `Allocated`, `Pre-Encumbered`, `Encumbered`, `Carry-Over Encumbered`, `Disbursed`), `annual_procurement_plans` (ม.11)
   - ตารางกลุ่มจัดหาและสัญญา: `purchase_requisitions` (ปกติ/ฉุกเฉิน), `middle_price_disclosures` (บก.01-06 & ราคากลางยา NLEM), `procurement_committees` (พร้อมตรวจ COI), `master_blanket_contracts` (PA), `contracts_and_calloff_pos`, `contract_milestones`, `performance_bonds` (e-LG)
   - ตารางกลุ่มคลังเวชภัณฑ์ ตรวจรับ และสินทรัพย์: `or_consignment_usages`, `receiving_inspections` (รองรับ Lot/Expiry/Cold Chain/COA & การหักวันตรวจรับ), `medical_assets_and_reagent_analyzers` (ครุภัณฑ์การแพทย์/เครื่องฝากวาง/ตาราง Calibration)
   - ตารางกลุ่มการเงิน บัญชี และ Audit: `disbursement_vouchers` (3-Way Match, Ex-VAT, WHT 1% พร้อมยกเว้นกรณีซื้อจากหน่วยงานรัฐ/GPO, Penalty, Net Payable), `gl_journal_entries`, และ `system_audit_logs`
2. เขียน **PL/pgSQL Triggers & Functions**:
   - `trg_budget_encumbrance_sync`: ใช้ `SELECT ... FOR UPDATE ORDER BY budget_id ASC` ล็อกยอดจองงบเมื่ออนุมัติ PR, ตรวจสอบวัตถุประสงค์เงินบริจาค, ตัดโควตาสัญญาจะซื้อจะขาย (`Blanket PA`), คืนยอดเงินประหยัด (`Contract Savings`) ทันทีเมื่อลงนามสัญญา และคืนงบ 100% เมื่อยกเลิกโครงการ
   - `trg_disbursement_gl_sync`: เมื่อผ่าน 3-Way Match และจ่ายเงินสำเร็จ ให้ถอด VAT 7%, คำนวณ WHT 1% จากฐาน Ex-VAT (ยกเว้นกรณีผู้ขายเป็นองค์การเภสัชกรรม GPO หรือหน่วยงานรัฐ), หักค่าปรับ, คำนวณยอดโอนสุทธิ (`Net Payable = Incl-VAT - WHT - Penalty`), ปรับลด `encumbered`, เพิ่ม `disbursed`, และ Post คู่บัญชี GL แยกตามกองทุนและ Cost Center อัตโนมัติ
   - `fn_detect_hospital_procurement_anomalies`: ตรวจจับการแบ่งซื้อแบ่งจ้าง (`< 500k` ซ้ำใน 30 วัน), ตรวจการกระจุกตัวของวงเงิน (`490k - 499.9k`), บล็อกการตั้งกรรมการพิจารณาผลซ้ำกับกรรมการตรวจรับ (COI), และบล็อกราคาซื้อยาที่เกินราคากลางยา NLEM
3. สร้าง Materialized View `mv_executive_dashboard_kpis` พร้อม `UNIQUE INDEX` สำหรับ `REFRESH MATERIALIZED VIEW CONCURRENTLY` ผ่าน `pg_cron`
4. วาง **Row-Level Security (RLS)** แยกการมองเห็นข้อมูลตาม `department_id` และบทบาทหน้าที่ พร้อม View ปิดบังข้อมูลผู้ป่วย (PDPA Masking) สำหรับ Auditor

### 🎯 [ภารกิจของ `@BackendDeveloper` (Lead Backend API & Hospital Domain Engine Engineer — ใช้ `dgx-qwen2.5-coder:32b`)]
1. พัฒนา **Dual Authentication & MOPH Provider ID 2FA Service (`src/server/auth/`)**:
   - **ชั้นที่ 1 (`local-auth.service.ts`):** ตรวจสอบ Username/Password ด้วย `Argon2id` + Rate Limit + Account Lockout และบันทึก `auth_sessions_audit`
   - **ชั้นที่ 2 (`moph-provider-id.service.ts`):** เชื่อมต่อ OAuth 2.0 / OpenID Connect (OIDC with PKCE) กับระบบ **Health ID & Provider ID ของกระทรวงสาธารณสุข** ตรวจสอบ `provider_id`, รหัสสถานพยาบาล 5 หลัก (`hcode`), เลขใบประกอบวิชาชีพ (`council_code`) และออก **Step-Up 2FA Token** สำหรับธุรกรรมสำคัญ (อนุมัติงบ/PR, ลงนามตรวจรับพัสดุ PAdES, อนุมัติเคสฉุกเฉิน, สั่งโอนเงินเบิกจ่าย)
2. พัฒนา **3 Core Hospital Domain Engines (`src/server/engines/`)**:
   - `standstill-penalty.engine.ts`: คำนวณระยะเวลารออุทธรณ์ 7 วันทำการ (ข้ามวันหยุดราชการและวันหยุดพิเศษ ครม.) และคำนวณวันปรับสุทธิโดยหักวันตรวจรับของคณะกรรมการออก พร้อมล็อกเมื่อค่าปรับชนเพดาน 10%
   - `blanket-consignment.engine.ts`: บริหารโควตาสัญญาจะซื้อจะขายยา (`Blanket PA`) + รับข้อมูลยอดใช้เวชภัณฑ์ฝากขายจากห้องผ่าตัด (`OR Consignment` จาก HIS) แปลงเป็นใบตรวจรับและ PO อัตโนมัติภายใต้ `Idempotency-Key`
   - `three-way-match-tax.engine.ts`: ตรวจสอบ 3-Way Match (`PO === Inspection === Tax Invoice`), ถอด VAT 7% (`Ex-VAT = Incl-VAT * 100 / 107`), คำนวณภาษีหัก ณ ที่จ่าย 1% (`WHT 1%` จากฐาน Ex-VAT พร้อมยกเว้นอัตโนมัติกรณีผู้ขายคือองค์การเภสัชกรรม GPO หรือหน่วยงานรัฐ), หักค่าปรับ (`Penalty`), และคำนวณยอดโอนสุทธิ (`Net Payable = Incl-VAT - WHT - Penalty` ซึ่งสำหรับโจทย์ Shared-Fixture ต้องได้ **`1,010,000.00` บาท** ตรงกับ DB และ Frontend)
3. พัฒนา **API Route Handlers & Caching Layer (`src/app/api/`)**:
   - `/api/auth/login` และ `/api/auth/moph-provider-callback`
   - `/api/dashboard/kpis/route.ts`: ดึงข้อมูลจาก Redis Cache + PostgreSQL Materialized View `mv_executive_dashboard_kpis` ด้วยเวลาตอบสนอง `< 50ms`
   - `/api/procurement/pr`, `/api/contracts/call-off`, `/api/disbursement/3way-match` พร้อมเชื่อมต่อไปยัง e-GP, e-LG และ GFMIS Adapter

### 🎯 [ภารกิจของ `@FrontendDeveloper` (Lead GovTech & Healthcare UI/UX Engineer — ใช้ `dgx-qwen3-coder:30b`)]
1. ออกแบบ **Hospital GovTech Design System** ด้วย Tailwind CSS: Deep Navy (`#1E3A8A`), Gov Gold (`#D97706`), Clinical Emerald (`#059669`), Critical Rose (`#DC2626`), ตัวเลขการเงินบังคับใช้ `tabular-nums` ทั้งระบบ
2. วางโครงสร้าง App Router บน **Next.js 15**: `/login` (ระบบ Login 2 ชั้น: Username/Password + MOPH Provider ID 2FA), `/dashboard`, `/workspace/[role]` (`clinical-pharma`, `budget`, `procurement`, `legal`, `finance`), และ `/auditor`
3. พัฒนา **Core Enterprise Components**:
   - `<MophProviderId2FAModal />`: หน้าต่างยืนยันตัวตนขั้นที่ 2 (2FA) และ Step-Up Authentication ผ่านระบบ Provider ID ของกระทรวงสาธารณสุข ก่อนกดอนุมัติงบ/PR, ลงนามตรวจรับพัสดุ PAdES, หรือสั่งโอนเงิน
   - `<MultiFundAbsorptionBar />`: หลอดแสดงงบประมาณแยกตาม 4 แหล่งเงินโรงพยาบาล และ 5 สถานะวงเงิน (`Allocated` / `Pre-Encumbered` / `Encumbered` / `Carry-Over` / `Disbursed`)
   - `<BlanketQuotaTracker />` & `<ConsignmentUsageCard />`: การ์ดติดตามโควตาสัญญาจะซื้อจะขายยา (PA) และสรุปยอดใช้เวชภัณฑ์ฝากขายห้องผ่าตัด
   - `<StandstillTimerBadge />`: ตัวนับถอยหลัง 7 วันทำการ (อิงปฏิทินวันหยุดราชการ) พร้อมบล็อกปุ่มออก PO ทั้งฝั่ง Client และ Server Action
   - `<PharmaInspectionModal />`: หน้าจอตรวจรับยา วัคซีน และเครื่องมือแพทย์ (บันทึก Lot, วันหมดอายุ, อุณหภูมิ Cold Chain, ใบ COA และลงนาม PAdES ครบองค์ประชุม)
   - `<ThreeWayMatchCard />`: การ์ดเปรียบเทียบความถูกต้องของ PO + ใบตรวจรับ + ใบกำกับภาษี พร้อมแสดงการถอด VAT 7%, หัก WHT 1% (คิดจาก Ex-VAT), หักค่าปรับ และยอดโอนสุทธิ (`Net Payable = Incl-VAT - WHT - Penalty`)
   - `<DiffViewer />`: Component เปรียบเทียบร่างสัญญากับแบบมาตรฐานกรมบัญชีกลางแบบ Side-by-Side พร้อมบังคับระบุเหตุผลการแก้ไข
4. สร้าง Route Handler `src/app/api/dashboard/kpis/route.ts` ดึงข้อมูลจาก Redis / Materialized View ด้วยเวลาตอบสนอง `< 50ms`

### 🎯 [ภารกิจของ `@SecurityLead` (Chief Healthcare Security & Digital Forensics Officer — ใช้ `dgx-deepseek-r1:32b`)]
1. ดำเนินการทำ **STRIDE Threat Modeling** ป้องกันการปลอมแปลงสิทธิ์อนุมัติงบ/เงินบำรุง (Privilege Escalation), การแก้ไขตัวเลขราคากลางยา, การทุจริตเบิกเวชภัณฑ์ฝากขายทิพย์ (Phantom Consignment Billing), และการโจมตี Webhook e-LG
2. กำหนดสเปกความปลอดภัย **Dual Authentication & MOPH Provider ID 2FA**:
   - ชั้นที่ 1: Local Username/Password จัดเก็บด้วย `Argon2id` + Rate Limiting + Account Lockout
   - ชั้นที่ 2: เชื่อมต่อ OAuth 2.0 / OIDC (PKCE) กับระบบ **Health ID & Provider ID ของกระทรวงสาธารณสุข** ตรวจสอบรหัสสถานพยาบาล 5 หลัก (`hcode`) และบังคับทำ **Step-Up 2FA** ซ้ำในทุกธุรกรรมสำคัญ (อนุมัติงบ/PR, ลงนาม PAdES, อนุมัติเคสฉุกเฉิน, สั่งโอนเงินเบิกจ่าย)
3. วางโครงสร้าง **Partitioned Cryptographic Hash Chaining + Daily Merkle Tree Root** บนตาราง `system_audit_logs` พร้อมส่งออก Snapshot ไปยัง WORM Storage (กำหนดรูปแบบฟิลด์ `prev_hash` และ `row_hash` ให้ `@DatabaseEngineer` นำไปใช้ตรงกัน)
4. กำหนดสเปกการตรวจสอบ **PKI Digital Signature (PAdES-LTV)**, **e-Timestamping (RFC 3161)**, และกลไกควบคุมการใช้ทางด่วนฉุกเฉินทางการแพทย์ (`EMERGENCY_RETROSPECTIVE_PR`) ไม่ให้ถูกใช้เป็นช่องโหว่เลี่ยงการประกวดราคา
5. วางระบบควบคุมสิทธิ์ **Zero-Trust Read-Only & PDPA Anonymization** สำหรับผู้ตรวจสอบภายนอก (สตง. / ป.ป.ช.) พร้อมลายน้ำดิจิทัล (Dynamic Watermark) และปุ่มตรวจสอบความสมบูรณ์ของ Hash Chain ด้วยตนเอง

---

## ⚖️ 3. กรอบกฎหมาย วัตถุประสงค์ และโครงสร้างระบบโรงพยาบาล (Domain Reference Specs)

### 3.1 กรอบกฎหมาย ระเบียบ และมาตรฐานอ้างอิง
- พ.ร.บ. การจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 และระเบียบกระทรวงการคลังฯ พ.ศ. 2560 (มาตรา 4, 11, 55, 56, 66, 97, 102, 103)
- ประกาศคณะกรรมการพัฒนาระบบยาแห่งชาติ (เกณฑ์ราคากลางยาแห่งชาติ - NLEM) และกฎกระทรวงกำหนดพัสดุที่รัฐต้องการส่งเสริมหรือสนับสนุน (สิทธิพิเศษองค์การเภสัชกรรม GPO / สภากาชาดไทย)
- ระเบียบกระทรวงสาธารณสุขว่าด้วยเงินบำรุงของหน่วยบริการในสังกัดกระทรวงสาธารณสุข และหลักเกณฑ์กองทุน สปสช. (UC) / ประกันสังคม / สวัสดิการข้าราชการ
- พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 (มาตรา 9 และ 26 - Qualified PKI Digital Signatures PAdES-LTV & RFC 3161 e-Timestamping)
- พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA - สำหรับการเชื่อมโยงเวชภัณฑ์รายผู้ป่วย HN/AN)
- เกณฑ์ ป.ป.ช. (การเปิดเผยราคากลาง บก.01 - บก.06), แนวทางการตรวจสอบของ สตง., และมาตรฐานการรับรองคุณภาพสถานพยาบาล (HA / JCI)
- มาตรฐานระบบ e-GP, e-LG, GFMIS, และระบบสารสนเทศโรงพยาบาล (HIS / DMS / MEMS)

### 3.2 วงจรการทำงานตั้งแต่ต้นน้ำถึงปลายน้ำ (End-to-End Hospital Lifecycle)
`คำของบประมาณพหุกองทุน ➔ จัดสรรงบ & ประกาศแผนประจำปี (ม.11) ➔ ขอซื้อขอจ้าง (PR ปกติ / ฉุกเฉินทางการแพทย์ / ซื้อร่วม) ➔ ตรวจสอบราคากลาง 6 ลำดับศักดิ์ & ราคากลางยา NLEM ➔ แต่งตั้งกรรมการ & ตรวจ COI ➔ จัดหา/ประกวดราคา/สิทธิพิเศษ GPO ➔ ล็อกเวลาอุทธรณ์ 7 วันทำการ (Standstill) ➔ ตรวจร่างสัญญา & e-LG ➔ บริหารสัญญาจะซื้อจะขาย (Blanket PA) & เวชภัณฑ์ฝากขายห้องผ่าตัด (OR Consignment) ➔ ตรวจรับงวดงาน/ยา/Cold Chain/COA ➔ ลงทะเบียนครุภัณฑ์การแพทย์/เครื่องฝากวาง (Reagent Rental) & ตารางสอบเทียบ HA ➔ 3-Way Match เบิกจ่าย ➔ ถอด VAT 7% คิดภาษีหัก ณ ที่จ่าย 1% & หักค่าปรับ ➔ ลงบัญชี GL แยกกองทุน/Cost Center`

### 3.3 โครงสร้างหน้าจอและฝ่ายที่เกี่ยวข้อง (6 Hospital Portals)
1. **หน้าหลัก Executive & Hospital Cash Flow Intelligence Dashboard:**
   - แยก 4 แหล่งเงินหลัก: (1) งบประมาณแผ่นดิน, (2) เงินบำรุงโรงพยาบาล, (3) เงินบริจาค (ระบุวัตถุประสงค์ vs ไม่ระบุวัตถุประสงค์), (4) งบค่าเสื่อม สปสช.
   - แสดง 5 สถานะวงเงิน (`Allocated`, `Pre-Encumbered`, `Encumbered`, `Carry-Over Encumbered`, `Disbursed`), สภาพคล่องเงินบำรุง (Net Working Capital & Payable Aging), Kanban Pipeline, SLA Alerts และ Transparency Hub & Auditor Portal
2. **กลุ่มภารกิจทางการแพทย์ พยาบาล เภสัชกรรม และห้องปฏิบัติการ (Clinical, Pharma & Lab Workspace):**
   - ยื่นคำของบรายปี, ติดตามงบคงเหลือ Real-time, เปิด PR 4 รูปแบบ (PR ทั่วไป/ครุภัณฑ์, Call-Off ตัดโควตาสัญญาจะซื้อจะขายยา PA, ตัดยอดเวชภัณฑ์ฝากขายห้องผ่าตัด OR Consignment ผูก HN/AN, และทางด่วนฉุกเฉินช่วยชีวิตผู้ป่วย ม.56(1)(ค) & ระเบียบฯ ข้อ 79 วรรคสอง)
3. **ฝ่ายแผนงานและงบประมาณพหุกองทุน (Multi-Fund Budget Control Hub):**
   - คุมเพดานงบ 4 กองทุน, ตรวจแผนประจำปี ม.11, บล็อกการใช้งบบริจาคผิดวัตถุประสงค์, คุมการจองงบ/ผูกพันงบ และการกันเงินเหลื่อมปี (30 กันยายน)
4. **ฝ่ายพัสดุ คลังเวชภัณฑ์ และวิศวกรรมทางการแพทย์ (Hospital Procurement & Supply Chain Hub):**
   - คัดเลือกวิธีจัดหา (เฉพาะเจาะจง, e-Bidding, คัดเลือก, ซื้อร่วม, สิทธิพิเศษ GPO), จัดทำ บก.01-06, ตรวจราคากลาง 6 ลำดับศักดิ์ & ราคากลางยา NLEM, แต่งตั้งกรรมการ & ตรวจ COI, ล็อก Standstill 7 วันทำการ, บริหารสัญญา Milestone / Blanket PA / Reagent Rental, ตรวจรับยา (Lot/Expiry/FDA/COA/Cold Chain) และลงทะเบียนครุภัณฑ์การแพทย์ตามเกณฑ์ HA
5. **ฝ่ายกฎหมายและนิติการ (Hospital Legal Review Desk):**
   - ตรวจร่างสัญญา Side-by-Side กับแบบมาตรฐานกรมบัญชีกลาง, ตรวจ e-LG 5%, วินิจฉัยการแก้ไขสัญญา (ม.97) และงด/ลดค่าปรับ (ม.102, 103), ดำเนินการเมื่อค่าปรับชนเพดาน 10%
6. **ฝ่ายการเงิน บัญชี และต้นทุนโรงพยาบาล (Disbursement, Tax, GL & Cost Center Desk):**
   - แจ้งเตือนคืนหลักประกันล่วงหน้า 30 วัน, ตรวจ 3-Way Matching, ถอด VAT 7% คิด WHT 1% จากฐาน Ex-VAT, หักค่าปรับ, โอนเงินสุทธิ (`Net Payable`) และลงบัญชี GL แยกกองทุนและ Cost Center

### 3.4 กฎควบคุมทางเทคนิคและข้อยกเว้นทางราชการ (Production-Hardening Rules)
- **Dual Authentication & MOPH Provider ID 2FA (ระบบยืนยันตัวตน 2 ชั้นของกระทรวงสาธารณสุข):**
  1. **ชั้นที่ 1 (Username / Password):** ยืนยันตัวตนด้วยบัญชีผู้ใช้ภายในโรงพยาบาล (`Argon2id` Password Hashing + Rate Limit + Account Lockout)
  2. **ชั้นที่ 2 (2FA ผ่านระบบ Provider ID ของ สธ.):** เชื่อมต่อระบบ **Health ID & Provider ID ของกระทรวงสาธารณสุข** ด้วยโปรโตคอล **OAuth 2.0 / OpenID Connect (OIDC with PKCE)** เพื่อตรวจสอบรหัสบุคลากรทางการแพทย์ (`provider_id`), รหัสสถานพยาบาล 5 หลัก (`hcode` ต้องตรงกับโรงพยาบาล), และเลขใบประกอบวิชาชีพ/ตำแหน่ง (`council_code`) พร้อมบังคับทำ **Step-Up Provider ID 2FA** ซ้ำทุกครั้งก่อนการอนุมัติงบ/PR, การลงนามตรวจรับพัสดุ PAdES, การอนุมัติเคสฉุกเฉินทางการแพทย์ และการอนุมัติโอนเงินเบิกจ่าย
- **Deterministic Pessimistic Locking:** `SELECT ... FOR UPDATE ORDER BY budget_id ASC` + `Idempotency-Key` + `version INT NOT NULL DEFAULT 1` (OCC)
- **PAdES-LTV & Multi-Sign Quorum:** ลงนามอิเล็กทรอนิกส์ตาม พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ฯ ม.9 และ ม.26 พร้อมประทับเวลา RFC 3161; หากกรรมการคนใดกดทักท้วง ระบบต้องระงับการเบิกจ่ายระดับ DB Trigger ทันที
- **Statutory Exceptions:** คืนเงินประหยัด (`Contract Savings`) ทันทีใน Transaction เดียวเมื่อเซ็นสัญญาต่ำกว่ายอดจอง PR; คืนงบ 100% เมื่อยกเลิกโครงการ; หยุดนับวันปรับระหว่างที่คณะกรรมการใช้เวลาตรวจรับพัสดุ; ล็อกเมื่อค่าปรับแตะ 10%; ควบคุมทางด่วนฉุกเฉิน (`EMERGENCY_RETROSPECTIVE_PR`) ด้วย SLA Countdown
- **Audit & Fraud Analytics:** ตาราง `system_audit_logs` แบบ Append-Only + Partitioned SHA-256 Hash Chain + Daily Merkle Root; ตรวจจับแบ่งซื้อแบ่งจ้าง (`< 500k` ซ้ำใน 30 วัน), วงเงินกระจุกตัว (`490k-499.9k`), และบล็อกราคายาเกิน NLEM

---
**⚡ คำสั่งปฏิบัติการทันทีสำหรับ `@ProductOwner` และ `@chief-of-staff` (PHASE 1 — BASELINE):**
1. **ห้ามถามขออนุมัติซ้ำ** — ให้สร้าง/ปลุก Agent ทั้ง 5 ตำแหน่ง (`@Architect`, `@DatabaseEngineer`, `@BackendDeveloper`, `@FrontendDeveloper`, `@SecurityLead`) โดยผูกกับ Model บน MSI DGX ตามตารางในขั้นตอนที่ 1.1 ทันที
2. **แจกจ่ายงานทั้ง 5 Track** และกำกับให้แต่ละ Agent **เขียนไฟล์จริงลงใน `C:\HOS-BACKOFFICE`** ตามพาธในขั้นตอนที่ 1.2 จนเสร็จสมบูรณ์
3. เมื่อไฟล์ทั้ง 5 Track ถูกเขียนลงดิสก์ครบแล้ว ให้ `@ProductOwner` ทำ **Cross-Agent Verification** ตรวจเช็กทุกจุดเชื่อมโยงและสรุปรายงานผลการตรวจสอบขั้นสุดท้ายทันที!

---

## 🚀 4. คำสั่งปฏิบัติการระยะที่ 2 (PHASE 2: FULL PRODUCTION WEB APP, DOCKER INFRASTRUCTURE & INTERACTIVE CRUD WORKFLOWS)

> **[คำอนุมัติล่วงหน้าจากผู้บังคับบัญชา - PRE-AUTHORIZED BY USER]:**
> ผู้ใช้สั่งการให้ **`@ProductOwner` (PM)** สั่งทีมผู้เชี่ยวชาญทั้ง 5 ตำแหน่ง (`@Architect`, `@DatabaseEngineer`, `@BackendDeveloper`, `@FrontendDeveloper`, `@SecurityLead`) ยกระดับระบบ `HOS-BACKOFFICE` (`C:\HOS-BACKOFFICE`) จากต้นแบบ Phase 1 ให้กลายเป็น **Production Web Application ที่ทำงานได้ครบวงจรจริง 100%** (พร้อมฐานข้อมูลจริง + Seed Data + ฟอร์มกรอกข้อมูล CRUD จริงทุกหน้าจอ + Production Docker Stack) ทันที!
> - **วิธีสั่งการ:** ให้ `@ProductOwner` แตกใบงาน Phase 2 (`assignments_create` หรือ `agents_spawn`) ให้ทีมผู้เชี่ยวชาญทั้ง 5 ตำแหน่ง และหากการรอการ์ด `agents_spawn` บน UI เกินเวลา ให้ `@ProductOwner` ลงมือเขียน/อัปเกรดไฟล์ทั้งหมดด้วยเครื่องมือ `Write` / `Edit` / `Bash` จนครบ 100% บนดิสก์เหมือนใน Phase 1!

### 📋 ใบงานบังคับ Phase 2 แยกตามสายงาน (5 Specialist Tracks — Production Web App)

#### 1. ภารกิจ Phase 2 ของ `@Architect` (`dgx-deepseek-r1:32b` — Production Docker & Deployment Stack)
ต้องสร้างไฟล์จริงลงดิสก์ดังนี้:
- **`C:\HOS-BACKOFFICE\docker-compose.yml`:**
  - บริการที่ 1 (`postgres`): `postgres:15-alpine` (พอร์ต `5432:5432`, ตั้งค่า `POSTGRES_DB=hos_backoffice`, `POSTGRES_USER=hos_admin`, `POSTGRES_PASSWORD=hos_secret_2560`, mount โฟลเดอร์ `./db/migrations:/docker-entrypoint-initdb.d:ro` เพื่อให้รัน Schema และ Seed อัตโนมัติทันทีที่เปิด Container)
  - บริการที่ 2 (`redis`): `redis:7-alpine` (พอร์ต `6379:6379`, เปิด AOF persistence สำหรับเก็บ KPI Cache `< 50ms` และตัวนับ Rate-Limit / Lockout)
  - บริการที่ 3 (`minio`): `minio/minio:latest` (พอร์ต `9000:9000` และ Console `9001:9001` สำหรับเก็บไฟล์แนบใบตรวจรับยา COA, รูปถ่าย Cold-Chain และสัญญา PDF PAdES-LTV แบบ WORM Object Lock)
- **`C:\HOS-BACKOFFICE\Dockerfile` และ `C:\HOS-BACKOFFICE\.env.example`:**
  - Dockerfile แบบ Multi-stage สำหรับ Next.js 15 Production Web App และไฟล์ `.env.example` ที่รวมตัวแปรเชื่อมต่อ PostgreSQL, Redis, MinIO และ MOPH Provider ID OAuth2/OIDC PKCE ครบถ้วน

#### 2. ภารกิจ Phase 2 ของ `@DatabaseEngineer` (`dgx-qwen2.5-coder:32b` — Production Seed Data & Stored Procedures)
ต้องสร้างไฟล์ SQL จริงลงดิสก์ที่:
- **`C:\HOS-BACKOFFICE\db\migrations\002_hospital_seed_data.sql`:**
  - ข้อมูลตั้งต้นพร้อมใช้งานจริงสำหรับโรงพยาบาลศูนย์ 1,000+ เตียง:
    1. **5 แผนกหลัก (`departments_cost_centers`):** `clinical-pharma`, `budget`, `procurement`, `legal`, `finance`
    2. **6 บัญชีผู้ใช้งานจริง (`users_and_moph_providers`):** มีรหัสผ่าน Argon2id, รหัส `moph_provider_id`, รหัสสถานพยาบาล 5 หลัก (`hcode = '10670'`), และเลขใบประกอบวิชาชีพ (`council_code`) สำหรับทดสอบล็อกอินครบทุกบทบาท (เภสัชกร, เจ้าหน้าที่งบประมาณ, เจ้าหน้าที่พัสดุ, นิติกร, เจ้าหน้าที่การเงิน, และผู้ตรวจสอบ สตง.)
    3. **5 กองทุนโรงพยาบาล (`hospital_funds_budgets`):** งบแผ่นดิน (`GOV_BUDGET`), เงินบำรุงโรงพยาบาล (`HOSPITAL_MAINTENANCE`), เงินบริจาคระบุวัตถุประสงค์ (`DONATION_SPECIFIED`), เงินบริจาคไม่ระบุวัตถุประสงค์ (`DONATION_UNSPECIFIED`), และงบค่าเสื่อม สปสช. (`UC_DEPRECIATION`) พร้อมยอดวงเงินทั้ง 5 สถานะ
    4. **ปฏิทินวันหยุดราชการไทย (`gov_holiday_calendar`):** วันหยุดราชการประจำปีสำหรับคำนวณระยะรอลงนาม Standstill 7 วันทำการ
    5. **บัญชียาหลักแห่งชาติ NLEM & เวชภัณฑ์ (`drug_medical_catalog`):** รายการยาช่วยชีวิต, ยาต้านไวรัส, น้ำยาตรวจวิเคราะห์ (Reagent Rental), และเวชภัณฑ์ฝากขายห้องผ่าตัด (OR Consignment) พร้อมราคากลาง NLEM
    6. **ข้อมูลสัญญาจะซื้อจะขาย (`procurement_contracts_blanket`), ใบขอซื้อ (`purchase_requisitions`), ใบตรวจรับ (`receiving_inspections`), และใบสำคัญเบิกจ่าย (`disbursement_vouchers`)** ที่รวมรายการ Shared Fixture (`1,070,000.00 − 10,000.00 − 50,000.00 = 1,010,000.00` บาท) พร้อมสั่ง `REFRESH MATERIALIZED VIEW mv_executive_dashboard_kpis;` ท้ายไฟล์

#### 3. ภารกิจ Phase 2 ของ `@BackendDeveloper` (`dgx-qwen2.5-coder:32b` — Interactive CRUD APIs & Live State Persistence)
ต้องสร้างและอัปเกรด API Route Handlers ให้รองรับทั้ง `GET` (ดึงรายการจริง) และ `POST`/`PATCH` (สร้างและอัปเดตสถานะจริง โดยทำงานได้ทั้งโหมดเชื่อม PostgreSQL จริง และโหมด Persistent JSON/Memory Store เมื่อรันแบบไม่ต้องเปิด Docker):
- **`C:\HOS-BACKOFFICE\src\server\lib\store.ts`:**
  - ชั้นจัดการข้อมูลกลาง (Hybrid PostgreSQL + Live Persistent Store) ที่เก็บข้อมูล PR, Blanket PA, OR Consignment, ผลตรวจรับยา, ใบสำคัญเบิกจ่าย 3-Way Match, และ Audit Hash Chain (`prev_hash` / `row_hash`) ให้การกดปุ่มทุกหน้าบน Web App บันทึกและเปลี่ยนตัวเลขบน Dashboard แบบ Real-time ทันที
- **อัปเกรด/สร้าง API Routes ให้ครบทั้งการอ่านและเขียนข้อมูลจริง:**
  - `C:\HOS-BACKOFFICE\src\app\api\procurement\pr\route.ts` (`GET` รายการ PR ทั้งหมด + `POST` สร้างใบขอซื้อ PR ใหม่ พร้อมตรวจราคากลาง NLEM และตัดยอด `PRE_ENCUMBERED`)
  - `C:\HOS-BACKOFFICE\src\app\api\contracts\call-off\route.ts` (`GET` รายการสัญญา Blanket PA + `POST` ออกใบสั่งซื้อ Call-Off PO ตัดโควตาสัญญาและตรวจล็อก Standstill 7 วันทำการ)
  - `C:\HOS-BACKOFFICE\src\app\api\consignment\webhook\route.ts` (`GET` รายการ OR Consignment + `POST` บันทึกการใช้เวชภัณฑ์ฝากขายห้องผ่าตัดพร้อมตรวจ `Idempotency-Key`)
  - `C:\HOS-BACKOFFICE\src\app\api\inspections\route.ts` (`GET` รายการตรวจรับ + `POST` บันทึกผลตรวจรับยา Lot/Expiry/Cold-Chain/COA และระงับการจ่ายทันทีเมื่อกรรมการกด `OBJECTION`)
  - `C:\HOS-BACKOFFICE\src\app\api\disbursement\3way-match\route.ts` (`GET` รายการใบสำคัญเบิกจ่าย + `POST` คำนวณและอนุมัติจ่าย 3-Way Match ถอด VAT 7%, หัก WHT 1% Ex-VAT, หักค่าปรับ และบันทึก Audit Hash Chain)
  - `C:\HOS-BACKOFFICE\src\app\api\audit\chain\route.ts` (`GET` ดึงข้อมูล `system_audit_logs` พร้อมฟังก์ชันตรวจสอบความถูกต้องของสายโซ่ SHA-256 `prev_hash` / `row_hash` และ Daily Merkle Root แบบสด)

#### 4. ภารกิจ Phase 2 ของ `@FrontendDeveloper` (`dgx-qwen3-coder:30b` — Full Interactive Web App UI & Live Forms)
ต้องอัปเกรดหน้าจอ Web App ให้ผู้ใช้สามารถ **กรอกฟอร์ม กดปุ่มทำรายการจริง และเห็นผลลัพธ์เปลี่ยนแบบ Real-time** บนเบราว์เซอร์ครบทุกฝ่าย:
- **`C:\HOS-BACKOFFICE\src\app\workspace\[role]\page.tsx`:**
  - **`clinical-pharma`:** ฟอร์มสร้างใบขอซื้อยา/เวชภัณฑ์ (PR ปกติ / ฉุกเฉิน `EMERGENCY_RETROSPECTIVE_PR` / สิทธิพิเศษ GPO) + ฟอร์มบันทึกยอดใช้เวชภัณฑ์ฝากขายห้องผ่าตัด (OR Consignment) + ปุ่มเปิด `<PharmaInspectionModal />` ที่บันทึกผลตรวจรับลง API `/api/inspections` จริงและแสดงตารางรายการตรวจรับล่าสุด
  - **`budget`:** แสดงหลอดงบประมาณ 5 กองทุนแบบสดจาก API + ตารางอนุมัติวงเงิน PR ที่รอจองงบ (`PRE_ENCUMBERED`) พร้อมปุ่มกดอนุมัติงบ/โอนงบ
  - **`procurement`:** ฟอร์มออกใบสั่งซื้อ Call-Off PO ตัดโควตาสัญญาจะซื้อจะขาย (`Blanket PA`) ที่ยิงเข้า `/api/contracts/call-off` จริง (เห็นยอดโควตาคงเหลือลดลงทันที) + ตัวนับถอยหลัง Standstill 7 วันทำการ
  - **`legal`:** หน้าตรวจร่างสัญญา `<DiffViewer />` พร้อมฟอร์มบันทึกความเห็นนิติกรและการตรวจสอบหลักประกันสัญญา e-LG 5%
  - **`finance`:** ฟอร์มคำนวณและตั้งเบิก 3-Way Match แบบโต้ตอบได้จริง (กรอกยอดตั้งเบิก `Incl-VAT`, เลือกประเภทผู้ขาย `PRIVATE` / `GPO` / `GOV_AGENCY`, กรอกวันส่งมอบล่าช้า/ค่าปรับ แล้วกดคำนวณผ่าน API `/api/disbursement/3way-match` เพื่อดูยอด `Ex-VAT`, `WHT 1%`, `Penalty`, และ `Net Payable` พร้อมบันทึกลงตารางใบสำคัญเบิกจ่ายทันที)
- **`C:\HOS-BACKOFFICE\src\app\auditor\page.tsx` และ `audit-chain.tsx`:**
  - เชื่อมต่อ `/api/audit/chain` ดึงรายการ Audit Log จริงที่เกิดจากการทำรายการในแต่ละหน้า พร้อมปุ่ม **"🔍 ตรวจสอบความสมบูรณ์ของสายโซ่ Hash Chain (Verify SHA-256 Chain Integrity)"** บนหน้าจอ

#### 5. ภารกิจ Phase 2 ของ `@SecurityLead` (`dgx-deepseek-r1:32b` — Automated Verification & Production Readiness Suite)
- สร้างไฟล์สคริปต์ตรวจสอบความสมบูรณ์ครบวงจรที่ **`C:\HOS-BACKOFFICE\scripts\verify-production.mjs`** สำหรับรันทดสอบทั้งระบบ (ตรวจสูตร 3-Way Match Shared Fixture, ตรวจ Standstill & Penalty Cap 10%, ตรวจ SHA-256 Audit Hash Chain Verification, และตรวจความครบถ้วนของไฟล์ทั้งหมด) พร้อมอัปเดต `docs/security/security-forensics-spec.md` ให้ครอบคลุม Production Deployment Checklist!


---

## 🏛️ 5. คำสั่งปฏิบัติการระยะที่ 3 (PHASE 3: ANNUAL BUDGET PROPOSAL ENGINE — ระบบคำของบประมาณประจำปีพหุกองทุน)

> **[วัตถุประสงค์ & มาตรฐานกำกับ]:**  
> จัดทำระบบจัดทำและยื่นคำของบประมาณรายจ่ายล่วงหน้า (Annual Budget Proposal Hub) ประจำปีงบประมาณ พ.ศ. 2570 ตามระเบียบว่าด้วยการบริหารงบประมาณรายจ่ายของสถานพยาบาลภาครัฐ และสำนักงบประมาณ

### 5.1 โครงสร้างหมวดหมู่งบประมาณ (4 งบหลัก 5 แหล่งเงิน)
1. **งบดำเนินงาน (Operating Budget):** ค่าวัสดุวิทยาศาสตร์การแพทย์, ค่ายาและเวชภัณฑ์มิใช่ยา, ค่าสาธารณูปโภค
2. **งบลงทุน (Capital Expenditure):** ครุภัณฑ์การแพทย์ขั้นสูง (High-end Medical Equipment), สิ่งก่อสร้างและปรับปรุงอาคารผู้ป่วย
3. **งบค่าเสื่อม สปสช. (UC Depreciation Fund):** จัดหาเพื่อทดแทนครุภัณฑ์เดิมที่หมดอายุการใช้งานหรือซ่อมแซมใหญ่
4. **งบเงินบำรุงโรงพยาบาล (Hospital Maintenance Fund):** โครงการพัฒนาคุณภาพบริการและนวัตกรรมทางการแพทย์

### 5.2 สถานะวงจรชีวิตของคำขอ (State Machine)
- `DRAFT` ➔ `SUBMITTED` ➔ `DEPT_APPROVED` (หัวหน้าแผนก/ฝ่ายเห็นชอบ) ➔ `STRATEGY_REVIEW` (ฝ่ายแผนงานและยุทธศาสตร์กลั่นกรอง) ➔ `ALLOCATED` (บรรจุเข้าแผนงบประมาณประจำปี)

### 5.3 รหัสและเส้นทางเชื่อมโยง (Routes & Sequences)
- **URL หน้าจอ:** `/workspace/budget/proposals`
- **API Endpoint:** `/api/budget/proposals` (`GET`, `POST`, `PATCH`)
- **รูปแบบเลขรันคำขอ:** `BP-10670-{YYYY}-{NUM}` (รันตามปีงบประมาณ เช่น `BP-10670-2570-0001`)

---

## 👨‍⚕️ 6. คำสั่งปฏิบัติการระยะที่ 4 (PHASE 4: HOSPITAL PERSONNEL MASTER DIRECTORY — ทะเบียนบุคลากร & สิทธิ์กรรมการตรวจรับ)

> **[วัตถุประสงค์ & มาตรฐานกำกับ]:**  
> จัดทำฐานข้อมูลบุคลากรทางการแพทย์และสายสนับสนุนโรงพยาบาลศูนย์ (1,000+ เตียง) ให้เป็น Single Source of Truth สำหรับการแต่งตั้งคณะกรรมการจัดซื้อจัดจ้าง/ตรวจรับพัสดุตาม พ.ร.บ. จัดซื้อจัดจ้างฯ พ.ศ. 2560 และการคุ้มครองข้อมูลส่วนบุคคล (PDPA)

### 6.1 คุณลักษณะและข้อกำหนดทางเทคนิค (Specifications)
1. **10 สายวิชาชีพหลัก (Personnel Types):**
   - แพทย์เฉพาะทาง (`PHYSICIAN`), ทันตแพทย์/พยาบาลวิชาชีพ (`NURSE`), เภสัชกร (`PHARMACIST`), นักเทคนิคการแพทย์ (`TECH_MED`), เจ้าหน้าที่พัสดุ (`PROCUREMENT_OFFICER`), เจ้าหน้าที่การเงิน (`FINANCE_OFFICER`), นิติกร (`LEGAL_OFFICER`), วิศวกรชีวการแพทย์ (`ENGINEER`), ผู้บริหารระดับสูง (`EXECUTIVE`), และเจ้าหน้าที่ทั่วไป (`STAFF`)
2. **การคุ้มครองข้อมูลส่วนบุคคล (PDPA Masking):**
   - แสดงผลเลขประจำตัวประชาชน 13 หลักในรูปแบบพรางตัวเสมอ: `1-1002-XXXXX-XX-X` (อนุญาตให้ถอดรหัสเฉพาะฟังก์ชันตรวจสอบสิทธิ์และลายเซ็นดิจิทัล)
3. **การยืนยันตัวตนและการลงนามดิจิทัล (MOPH 2FA & PAdES-LTV):**
   - เชื่อมโยงรหัส `moph_provider_id` สำหรับ 2FA
   - ตรวจสอบความพร้อมของใบรับรองอิเล็กทรอนิกส์ (`pades_signature_active`) สำหรับลงนามในรายงานผลการตรวจรับพัสดุอิเล็กทรอนิกส์
4. **การตรวจสอบคุณสมบัติกรรมการ (Committee Eligibility & COI):**
   - คัดกรองผู้มีสิทธิได้รับการแต่งตั้งเป็นคณะกรรมการกำหนดราคากลาง, กรรมการพิจารณาผล และกรรมการตรวจรับพัสดุ ป้องกันกรณีผลประโยชน์ทับซ้อน (Conflict of Interest)
5. **รหัสเจ้าหน้าที่อัตโนมัติ (Employee Running Code Sequence):**
   - ผูกโยงกับ Running Number Engine หมวด `EMP`: `EMP-10670-{NUM}` (เช่น `EMP-10670-0001` ถึง `EMP-10670-0016`)

### 6.2 ฐานข้อมูลและสคริปต์ Migration
- **ไฟล์ DDL:** `database/migrations/005_hospital_personnel.sql` (ตาราง `hospital_personnel`)
- **API Endpoint:** `/api/admin/personnel` (`GET`, `POST`, `PUT`, `DELETE`)
- **หน้าจอ Master Hub:** `/workspace/admin/master-data` (แท็บ 1: ทำเนียบบุคลากร)

---

## 🏢 7. คำสั่งปฏิบัติการระยะที่ 5 (PHASE 5: DEPARTMENTS & COST CENTERS REPOSITORY — โครงสร้างกลุ่มงานและศูนย์ต้นทุน)

> **[วัตถุประสงค์ & มาตรฐานกำกับ]:**  
> รองรับการแบ่งส่วนราชการตามโครงสร้างโรงพยาบาลศูนย์/โรงพยาบาลทั่วไปของกระทรวงสาธารณสุข พร้อมระบบรหัสศูนย์ต้นทุน (Cost Center) สำหรับการตัดงบประมาณและบันทึกบัญชี GL

### 7.1 โครงสร้างกลุ่มภารกิจและแผนก (12 แผนกหลัก)
- **กลุ่มภารกิจด้านการแพทย์ (`MED`):** อายุรกรรม, ศัลยกรรม, กุมารเวชกรรม, สูติ-นรีเวชกรรม
- **กลุ่มภารกิจด้านบริการทางการแพทย์ (`DIAG`):** พยาธิวิทยากายวิภาคและชันสูตร, รังสีวิทยาและเวชศาสตร์นิวเคลียร์
- **กลุ่มภารกิจด้านพัฒนาระบบบริการและสนับสนุนบริการสุขภาพ (`SUPP`):** เภสัชกรรมและคลังยา, วิศวกรรมชีวการแพทย์
- **กลุ่มภารกิจด้านการพยาบาล (`NURSE`):** ผู้ป่วยในและวิกฤต (ICU/OR), ผู้ป่วยนอกและอุบัติเหตุฉุกเฉิน (OPD/ER)
- **กลุ่มภารกิจด้านอำนวยการ (`ADMIN`):** จัดซื้อพัสดุและบำรุงรักษา, การเงินบัญชีและงบประมาณ

### 7.2 ฟังก์ชันกำกับดูแล
- ตรวจสอบสิทธิ์การขอซื้อพัสดุ (`is_procurement_authorized`)
- ผูกรหัสศูนย์ต้นทุน 10 หลักของกระทรวงการคลัง (เช่น `10670-MED01`, `10670-PHA01`)
- **ไฟล์ DDL:** `database/migrations/004_departments_and_running_numbers.sql` (ตาราง `hospital_mission_groups`, `hospital_departments`)
- **API Endpoint:** `/api/admin/departments` (`GET`, `POST`, `PUT`, `DELETE`)

---

## ⚙️ 8. คำสั่งปฏิบัติการระยะที่ 6 (PHASE 6: SYSTEM CONFIGURATION & RUNNING NUMBER ENGINE — เมนูหลักการตั้งค่า และระบบจัดการเลขรันเอกสาร)

> **[วัตถุประสงค์ & มาตรฐานกำกับ]:**  
> จัดทำโครงสร้างเมนูหลัก "⚙️ การตั้งค่า" (System Settings) บนแถบ Navigation หลัก และแยกระบบกำหนดเลขรันเอกสารราชการ (Running Number Configuration Engine) เป็นศูนย์กลางการควบคุมรูปแบบเลขรันของโรงพยาบาล

### 8.1 เมนูหลักบน Navigation Bar (`src/app/layout.tsx`)
- เพิ่มหมวดหลัก **"⚙️ การตั้งค่า" (System Settings)**:
  1. `🔢 ระบบจัดการเลขรันเอกสาร (Running Number Configuration Engine)` ➔ `/workspace/settings/running-numbers`
  2. `🏢 โครงสร้างกลุ่มงาน & แผนก (Departments & Cost Centers)` ➔ `/workspace/admin/master-data`
  3. `👨‍⚕️ ทะเบียนบุคลากร & กรรมการตรวจรับ (Personnel Directory)` ➔ `/workspace/admin/master-data`
- ปรับหมวด **"ผู้บริหาร & ตรวจสอบ"**: โฟกัสที่ `บุคลากร & โครงสร้างแผนก (Personnel & Departments)`

### 8.2 สเปกของระบบจัดการเลขรันเอกสาร (Running Number Engine)
1. **ครอบคลุม 9 หมวดเอกสารราชการของโรงพยาบาล:**
   - `PR`: ใบขอซื้อ/ขอจ้าง (`PR-10670-{YEAR}-{NUM}`)
   - `PO`: ใบสั่งซื้อ/สั่งจ้าง (`PO-10670-{YEAR}-{NUM}`)
   - `REQ`: ใบเบิกพัสดุ/เวชภัณฑ์ (`REQ-10670-{YEAR}-{NUM}`)
   - `BP`: คำของบประมาณประจำปี (`BP-10670-{YEAR}-{NUM}`)
   - `GRN`: ใบรับสินค้า/พัสดุ (`GRN-10670-{YEAR}-{NUM}`)
   - `PV`: ใบสำคัญเบิกจ่าย (`PV-10670-{YEAR}-{NUM}`)
   - `CPO`: สัญญาจัดซื้อจัดจ้าง (`CPO-10670-{YEAR}-{NUM}`)
   - `CN`: ใบตัดจำหน่ายสินทรัพย์ (`CN-10670-{YEAR}-{NUM}`)
   - `EMP`: รหัสเจ้าหน้าที่/บุคลากร (`EMP-10670-{NUM}`)
2. **กลไกความปลอดภัยของลำดับเลข (Row-Locked Atomic Sequence):**
   - ใช้คำสั่ง PostgreSQL `SELECT ... FOR UPDATE` บนตาราง `document_running_numbers` ป้องกัน Race Condition และปัญหาเลขซ้ำหรือกระโดด
   - บันทึกประวัติการออกเลขลงตาราง `document_running_logs` พร้อม Audit Hash
3. **การจัดการ CRUD ครบวงจร (เพิ่ม / แก้ไข / ลบ / ทดสอบ):**
   - รองรับการกำหนด Prefix, Digit Length (3-8 หลัก), รูปแบบปี (BE_4, BE_2, AD_4, AD_2)
   - นโยบายการรีเซ็ต: `YEARLY` (ทุก 1 ต.ค.), `MONTHLY`, `NEVER`
   - ปุ่มทดสอบออกเลขจริงแบบ Real-time (`⚡ ทดสอบออกเลขถัดไป`)
- **หน้าจอเฉพาะ:** `/workspace/settings/running-numbers`
- **API Endpoint:** `/api/admin/running-numbers` (`GET`, `POST`, `PUT`, `DELETE`, `GENERATE_NEXT`)

---

## 🌐 9. สรุปสถานะการขึ้นระบบจริงบน MSI DGX & AGENTSROOM AUDIT LOG

- **ระบบปฏิบัติการเป้าหมาย:** MSI DGX Supercomputer (`192.168.1.224:3080`)
- **Service ควบคุม:** `systemd --user` บริการ `hos-backoffice.service` (Auto-restart, 24/7 Availability)
- **Next.js 15 App Router:** 20/20 Routes Compiled Successfully (0 TypeScript / ESLint errors)
- **ตารางใบงาน AgentsRoom Project (`proj-1793437514135-a59ai2`):**
  - Ticket #11: `📑 ระบบยื่นคำของบประมาณประจำปีพหุกองทุน (Annual Budget Proposal Hub FY2570)` ➔ **Done**
  - Ticket #12: `🏢 ฐานข้อมูลกลุ่มงาน/แผนก ศูนย์ต้นทุน และระบบกำหนดเลขรันเอกสาร` ➔ **Done**
  - Ticket #13: `👨‍⚕️ ฐานข้อมูลบุคลากร และระบบจัดการเลขรัน Number (CRUD ครบวงจร)` ➔ **Done**
  - Ticket #14: `⚙️ เพิ่มเมนูหลัก การตั้งค่า และย้ายระบบจัดการเลขรันเอกสาร (Running Number Configuration Engine)` ➔ **Done**


---

## 📒 10. คำสั่งปฏิบัติการระยะที่ 7 (PHASE 7: HOSPITAL GENERAL LEDGER & ACCOUNTING HUB — ฝ่ายบัญชีและงบการเงิน)

> **[วัตถุประสงค์ & มาตรฐานกำกับ]:**  
> จัดทำระบบบัญชีแยกประเภททั่วไป (General Ledger - GL) ของโรงพยาบาลศูนย์ตามมาตรฐานการบัญชีภาครัฐ และระเบียบกระทรวงการคลัง ว่าด้วยการทำบัญชีและรายงานการเงินของหน่วยงานของรัฐ

### 10.1 ผังบัญชีมาตรฐานโรงพยาบาล (Chart of Accounts - COA)
- ครอบคลุม 5 หมวดบัญชีสากล:
  1. **สินทรัพย์ (1xxxxx):** เงินสด/เงินสดย่อย (110101), เงินฝากธนาคารเงินบำรุง (110201), เวชภัณฑ์ยาคงคลัง (110401), วัสดุการแพทย์คงคลัง (110402), ลูกหนี้ค่ารักษา สปสช. UC (120101), ครุภัณฑ์การแพทย์ (140101), ค่าเสื่อมราคาสะสม (140102)
  2. **หนี้สิน (2xxxxx):** เจ้าหนี้การค้าเวชภัณฑ์และยา (210101), ภาษีเงินได้หัก ณ ที่จ่ายค้างจ่าย ภ.ง.ด. 53 (210201), เงินประกันสัญญาค้างจ่าย e-LG (210301)
  3. **ส่วนของทุน (3xxxxx):** เงินทุนสะสมโรงพยาบาล (310101)
  4. **รายได้ (4xxxxx):** รายได้ค่ารักษาพยาบาล สปสช. (410101), รายได้ค่าปรับผู้ขายส่งมอบล่าช้า (430101)
  5. **ค่าใช้จ่าย (5xxxxx):** ต้นทุนยาและเวชภัณฑ์ที่ใช้ไป (510101), ค่าเสื่อมราคาครุภัณฑ์การแพทย์ (510201)

### 10.2 กลไกการลงบัญชีคู่อัตโนมัติ (Auto GL Posting Engine)
- บันทึกบัญชีคู่ เดบิต = เครดิต อัตโนมัติทันทีที่เกิดเหตุการณ์ทางเศรษฐกิจ:
  - **เมื่อตรวจรับพัสดุ/ยาเข้าคลัง:** เดบิต *เวชภัณฑ์คงคลัง (110401)* / เครดิต *เจ้าหนี้การค้า (210101)*
  - **เมื่ออนุมัติจ่าย 3-Way Match:** เดบิต *เจ้าหนี้การค้า (210101)* / เครดิต *เงินฝากธนาคาร (110201)*, เครดิต *ภาษีหัก ณ ที่จ่ายค้างจ่าย (210201)*, เครดิต *รายได้ค่าปรับ (430101)*
- **งบทดลองประจำงวด (Trial Balance):** แสดงยอดยกมา + ยอดเคลื่อนไหว = ยอดยกไป พร้อมการันตีความสมดุลเดบิต = เครดิต Real-time
- **URL หน้าจอ:** `/workspace/accounting`
- **API Endpoints:** `/api/accounting/gl`, `/api/accounting/chart-of-accounts`, `/api/accounting/trial-balance`

---

## 📊 11. คำสั่งปฏิบัติการระยะที่ 8 (PHASE 8: HOSPITAL INTELLIGENCE & REPORTS HUB — ศูนย์รายงาน 4 เสาหลัก)

> **[วัตถุประสงค์ & มาตรฐานกำกับ]:**  
> รวมศูนย์รายงานมาตรฐานราชการและสารสนเทศโรงพยาบาล 4 เสาหลัก รองรับการส่งออก Excel (.xlsx/CSV) และพิมพ์รายงานทางการ (PDF)

### 11.1 เสารายงาน 4 มิติ
1. **เสาที่ 1 (รายงานพัสดุ & จัดซื้อจัดจ้าง):** แบบสรุปผลการจัดซื้อจัดจ้างรายเดือน (สขร. 1) ตามประกาศคณะกรรมการข้อมูลข่าวสารของราชการ พร้อมประหยัดงบ
2. **เสาที่ 2 (รายงานการเงิน & ภาษี):** รายงานอายุหนี้เจ้าหนี้การค้า (AP Aging 30/60/90 วัน) และรายงานภาษีหัก ณ ที่จ่าย ภ.ง.ด. 53 (1% Ex-VAT)
3. **เสาที่ 3 (รายงานคลังยา & FEFO):** เฝ้าระวังยาและเวชภัณฑ์ใกล้หมดอายุ 3, 6, 12 เดือน ป้องกันยาเสื่อมสภาพ และสรุปตัดใช้วัสดุผ่าตัดฝากขายห้อง OR
4. **เสาที่ 4 (รายงานธรรมาภิบาล สตง./ป.ป.ช.):** ตรวจจับแบ่งซื้อแบ่งจ้าง (< 500,000 บาทซ้ำใน 30 วัน), การซื้อยาเกินราคากลาง NLEM, และการตรวจ COI
- **URL หน้าจอ:** `/workspace/reports`
- **API Endpoint:** `/api/reports`

---

## 🏢 12. คำสั่งปฏิบัติการระยะที่ 9 (PHASE 9: VENDOR / SUPPLIER MASTER HUB — ทะเบียนคู่ค้า & ผู้ประกอบการ)

> **[วัตถุประสงค์ & มาตรฐานกำกับ]:**  
> จัดทำระบบทะเบียนคู่ค้านิติบุคคล 13 หลัก ข้อมูลบัญชีธนาคารโอนเงินตรง GFMIS และระบบตรวจสอบสิทธิภาษีหัก ณ ที่จ่ายตามระเบียบกระทรวงการคลัง

- **คุณสมบัติ:**
  - ทะเบียนนิติบุคคล 13 หลัก, ที่อยู่ตาม ภ.พ.20, เครดิตเทอม
  - แยกประเภทคู่ค้าเพื่อสิทธิภาษีอัตโนมัติ: องค์การเภสัชกรรม (GPO) และหน่วยงานรัฐ ได้รับยกเว้น WHT 1% ตามกฎหมาย
  - ผูกข้อมูลบัญชีธนาคารสำหรับจ่ายเงินผ่านระบบ GFMIS
  - ตรวจสอบและขึ้นทะเบียนผู้ทิ้งงาน (Blacklist) ตาม พ.ร.บ. 2560 ม.109
- **URL หน้าจอ:** `/workspace/admin/vendors`
- **API Endpoint:** `/api/admin/vendors`


---

## 🎨 13. คำสั่งปฏิบัติการระยะที่ 10 (PHASE 10: GOVTECH ENTERPRISE LAYOUT & ERGONOMIC NAVIGATION)

> **[วัตถุประสงค์ & การปรับปรุง]:**  
> ปรับปรุง Layout ภาพรวมและระบบนำทาง (Navigation System) ของแอปพลิเคชันให้เหมาะสมตามหลัก Ergonomics และ Human-Computer Interaction (HCI) สำหรับบุคลากรทางการแพทย์และผู้บริหาร

### 13.1 การปรับปรุงโครงสร้าง Layout
1. **Header & Single-line Streamlined Navbar:**
   - จัดวาง 8 หมวดเมนูหลักให้อยู่ในแถวเดียว ไม่ตกบรรทัด ป้องกันการขยายตัวของ Header บดบังหน้าจอ
   - ระบบ **Active State Indicator**: ไฮไลต์ปุ่มเมนูหลักที่สัมพันธ์กับหน้าจอที่ผู้ใช้กำลังเปิดดูอยู่โดยอัตโนมัติ
   - ระบบ **Smart Dropdown Positioning**: จัดชิดขวาอัตโนมัติสำหรับเมนูด้านขวา ป้องกันปัญหา Dropdown ล้นขอบจอ
2. **Mobile & Tablet Drawer Menu:**
   - เพิ่มปุ่ม Hamburger Toggle (`☰`) และ Drawer เมนูแบบพับเก็บได้ สำหรับใช้งานบนหน้าจอแท็บเล็ตและสมาร์ตโฟน
3. **Enterprise GovTech Footer:**
   - เพิ่มส่วนท้ายมาตรฐานแสดงข้อมูลโรงพยาบาลศูนย์ (HCODE 10670), กฎหมายกำกับ (พ.ร.บ. 2560, PAdES-LTV, PDPA), และสถานะเซิร์ฟเวอร์ MSI DGX Production 24/7


---

## 📊 14. คำสั่งปฏิบัติการระยะที่ 11 (PHASE 11: EXECUTIVE COMMAND CENTER DASHBOARD REVAMP)

> **[วัตถุประสงค์ & การปรับปรุง]:**  
> ปรับปรุงหน้าจอหลัก Executive Dashboard (`/dashboard`) ให้เป็นศูนย์บัญชาการข้อมูลผู้บริหารระดับสูง (Hospital Command Center) เชื่อมโยงข้อมูล Real-time ครบทุกมิติของโรงพยาบาลศูนย์ 1,000+ เตียง

### 14.1 สถาปัตยกรรมและองค์ประกอบของ Dashboard ใหม่
1. **Executive Metric Cards (4 การ์ดตัวชี้วัดทางการเงินและยุทธศาสตร์):**
   - **งบพหุกองทุนรวม (5 กองทุน):** แสดงวงเงินจัดสรร ฿920.0M, ยอดเบิกจ่ายแล้ว ฿845.0M (อัตราการดูดซับงบ 91.8%), หลอดความคืบหน้าแบบ Gradient
   - **สภาพคล่องเงินบำรุงโรงพยาบาล (Cash at Bank):** ฿45.0M รองรับค่าใช้จ่ายหมุนเวียนได้ 4.2 เดือน (เกณฑ์ สธ. > 3 เดือน)
   - **เจ้าหนี้การค้ารอเบิกจ่าย (Accounts Payable):** ฿18.9M ผ่านการตรวจจ่าย 3-Way Match อัตโนมัติ จ่ายตรงเวลา 94.2%
   - **คำของบประมาณปี 2570 (Proposals Hub):** วงเงินยื่นขอ ฿28.5M (4 โครงการ) พร้อมลิงก์ตรงสู่หน้ารายละเอียด
2. **Command Actions Bar (แถบทางลัดคำสั่งด่วน 6 โมดูล):**
   - ขอซื้อยา PR • ยื่นคำของบปี 2570 • ตรวจคู่จ่าย 3-Way Match • ฝ่ายบัญชี & GL • ศูนย์รายงาน 4 เสา • ตั้งค่าเลขรัน
3. **Multi-Fund Absorption Gauges:**
   - หลอดแสดงการดูดซับ 5 กองทุน (Allocated, Pre-Encumbered, Encumbered, Disbursed)
4. **Supply Chain & Clinical Pipeline Hub:**
   - มอนิเตอร์ Standstill 7 วันทำการ, สัญญา Blanket PA, ยอดค้างตัด OR Consignment จาก HIS, และการ์ดแจ้งเตือนด่วน **FEFO Near-Expiry Alert**
5. **Hospital Financial Health & GL Ledger:**
   - ตรวจสอบสถานะดุลบัญชีงบทดลอง **(Trial Balance: เดบิต = เครดิต สมดุล 100%)**
   - แสดงรายการล่าสุดในสมุดรายวันทั่วไป (Recent Auto GL Journal Entries)
6. **GovTech Security & Transparency Assurance:**
   - ยืนยันความปลอดภัย Cryptographic SHA-256 Hash Chain สำหรับ สตง./ป.ป.ช., PAdES-LTV, และ MOPH 2FA Active

---

## 🤖 15. คำสั่งปฏิบัติการระยะที่ 12 (PHASE 12: EXECUTIVE AI COPILOT & ANTI-CORRUPTION WATCHDOG)

> **[วัตถุประสงค์ & การเชื่อมต่อ Local AI บน MSI DGX]:**  
> นำเทคโนโลยีปัญญาประดิษฐ์ (Artificial Intelligence) ระดับสูงมาติดตั้งใช้งานภายในระบบบริหารจัดการโรงพยาบาลภาครัฐ โดยเชื่อมโยงกับ Local On-Premises LLM บนเครื่องซูเปอร์คอมพิวเตอร์ **MSI DGX** (192.168.1.224) ภายใต้เงื่อนไขความมั่นคงปลอดภัยข้อมูลขั้นสูงสุด **100% PDPA Safe & Air-Gapped** (ไม่มีการส่งข้อมูลทางการเงิน ผู้ป่วย หรือพัสดุออกนอกเครือข่ายโรงพยาบาลแม้แต่ไบต์เดียว) พร้อมระบบสำรองปัญญาประดิษฐ์อัตโนมัติ (Deterministic GovTech Expert Fallback) ในกรณีเครือข่ายมีภาระงานสูง

### 15.1 สถาปัตยกรรมการเชื่อมต่อ (Architecture & Local Models)
- **Local Host:** MSI DGX Supercomputer (Ollama API: http://127.0.0.1:11434)
- **โมเดลที่ติดตั้งและรองรับ:**
  1. dgx-qwen3-coder:30b (โมเดลหลัก: ให้คำปรึกษาผู้บริหาร สรุปข้อมูลการเงิน และวิเคราะห์การจัดซื้อจัดจ้าง)
  2. dgx-deepseek-r1:32b (Deep Reasoning: ตรวจสอบทุจริตแบ่งซื้อแบ่งจ้าง และวิเคราะห์ข้อกฎหมาย พ.ร.บ. 2560)
  3. haiku:latest (Ultra-Fast Response: สอบถามข้อมูลด่วนและสรุปยอดคงเหลือ)
  4. gemma3:27b (General Hospital Synthesis: นโยบายและยุทธศาสตร์สาธารณสุข)
- **Zero Cloud Leakage:** ประมวลผลผ่าน POST /api/ai/copilot ภายในระบบ Local Next.js เข้าสู่ DGX GPUs โดยตรง

### 15.2 ระบบเฝ้าระวังความเสี่ยงและการทุจริต (AI Anti-Corruption Watchdog)
1. **Split Procurement Anomaly Detection (ตรวจจับแบ่งซื้อแบ่งจ้าง ม.56):**
   - เฝ้าระวังและแจ้งเตือนเมื่อพบคำสั่งซื้อ (PO/PR) แก่คู่ค้ารายเดียวกัน รวมวงเงินสูงกว่า 500,000 บาท ในรอบ 30 วัน เพื่อป้องกันการหลีกเลี่ยงกระบวนการ e-Bidding
2. **NLEM Drug Price Ceiling Watchdog (เพดานราคายากลางแห่งชาติ):**
   - สแกนเปรียบเทียบราคายาที่ขอจัดซื้อกับบัญชียาหลักแห่งชาติ (NLEM) พร้อมเปิด Hard-Stop ทันทีหากตรวจพบราคาสูงกว่าเกณฑ์
3. **FEFO Drug Expiry & Dynamic Ward Dispatch (เฝ้าระวังยาใกล้หมดอายุ):**
   - เฝ้าระวังเวชภัณฑ์ที่มีอายุคงเหลือต่ำกว่า 60 วัน (เช่น Meropenem 1g ล็อต M2601) พร้อมเสนอแนะแผนการโอนย้ายไปยัง ICU หรือหอผู้ป่วยที่มีอัตราการใช้สูง เพื่อลดอัตราสูญเปล่าเป็น 0%

### 15.3 ส่วนประกอบหน้าจอผู้ใช้ (User Experience & Components)
1. **Interactive Floating Copilot Widget (src/components/HospitalAiCopilot.tsx):**
   - ปุ่ม Floating AI Badge มุมขวาล่างของทุกหน้าจอระบบ (เข้าถึงได้จากทุกโมดูล)
   - หน้าต่างแชทพร้อมตัวเลือกโมเดล (Model Selector) และปุ่มล้างประวัติการสนทนา
   - ชิปคำสั่งลัดด่วน (Executive Action Chips) สำหรับวิเคราะห์สภาพคล่อง, ตรวจโกง, และยาใกล้หมดอายุ
2. **Dashboard Live Sentinel Scanner Card (src/app/dashboard/page.tsx):**
   - การ์ด HOS-AI Real-time Sentinel & Anti-Corruption Watchdog แสดงสถานะสด 3 ด้าน: จัดซื้อจัดจ้าง, คลังยา, และงบทดลอง
   - ปุ่ม Dispatch Custom Event สั่งเปิด Copilot พร้อมวิเคราะห์อัตโนมัติเพียงคลิกเดียว

### 15.4 ผลการทดสอบและการยอมรับ (Verification & Acceptance)
- ✅ API /api/ai/copilot ทดสอบการตอบสนองผ่าน Python Script สำเร็จ 100%
- ✅ Build Production ผ่านสมบูรณ์ (29 Route Static & Dynamic)
- ✅ บริการ hos-backoffice.service รันต่อเนื่อง 24/7 บน MSI DGX (http://192.168.1.224:3080)
- ✅ อัปเดตและปิด Ticket #21 ใน AgentsRoom เป็น done เรียบร้อยแล้ว

---

## 📋 16. คำสั่งปฏิบัติการระยะที่ 13 (PHASE 13: CAPITAL ASSETS COMPLIANCE & ASSET CODING STANDARDS)

> **[วัตถุประสงค์ & มาตรฐานกฎหมายกำกับดูแล (Compliance)]:**  
> ยกระดับระบบบริหารจัดการทรัพย์สินและครุภัณฑ์โรงพยาบาลภาครัฐให้สอดคล้องตามกฎหมายและระเบียบราชการ 100% ครอบคลุม:
> 1. **บัญชีราคามาตรฐานครุภัณฑ์ สำนักงบประมาณ (Bureau of the Budget Standard Price Guide):** เกณฑ์ราคากลางอ้างอิงและสเปกขั้นต่ำฉบับปีงบประมาณ พ.ศ. 2569 ป้องกันการจัดซื้อเกินเพดานราคาตาม พ.ร.บ. จัดซื้อจัดจ้างฯ 2560 ม.56
> 2. **การกำหนดรหัสครุภัณฑ์ มาตรฐานกรมบัญชีกลาง (CGD Fixed Asset Classification):** โครงสร้างรหัสทรัพย์สินภาครัฐตามหนังสือเวียน ว.106 พร้อมเกณฑ์การคิดค่าเสื่อมราคาแบบวิธีเส้นตรง (Straight-line) ราคาซาก 1 บาท

### 16.1 โครงสร้างการกำหนดรหัสครุภัณฑ์ (Asset Classification Formula)
- **รูปแบบรหัสราชการ:** \[หมวด 4 หลัก]-[ชนิด 3 หลัก]-[รายการ 4 หลัก]-[ปีงบประมาณ 4 หลัก]/[หมายเลขลำดับ 4 หลัก]\
- **ตัวอย่างรหัสจริง:** \6515-001-0001-2569/0001\
- **หมวดหมู่หลัก (Class Codes):**
  - \6515\: ครุภัณฑ์การแพทย์ (อายุใช้งาน 5-8 ปี, ค่าเสื่อม 12.5% - 20%)
  - \6525\: ครุภัณฑ์วิทยาศาสตร์และการแพทย์ขั้นสูง (Ultrasound, X-Ray, Autoclave: อายุ 7-10 ปี, ค่าเสื่อม 10% - 14.3%)
  - \7010\: ครุภัณฑ์คอมพิวเตอร์และระบบเครือข่าย (อายุ 5 ปี, ค่าเสื่อม 20%)
  - \2310\: ครุภัณฑ์ยานพาหนะ รถพยาบาลกู้ชีพฉุกเฉิน ALS (อายุ 8 ปี, ค่าเสื่อม 12.5%)
  - \7110\: ครุภัณฑ์สำนักงานและเตียงผู้ป่วย (อายุ 8-10 ปี, ค่าเสื่อม 10% - 12.5%)

### 16.2 เกณฑ์การคำนวณค่าเสื่อมราคาภาครัฐ (Straight-line Depreciation)
\text{ค่าเสื่อมราคาต่อปี} = \frac{\text{ราคาทุนจัดหา} - \text{ราคาซาก (1 บาท)}}{\text{อายุการใช้งาน (ปี)}}
- **ราคาซาก (Salvage Value):** กำหนดไว้ ฿1.00 บาท เสมอตามระเบียบกระทรวงการคลังว่าด้วยการบริหารพัสดุภาครัฐ
- **มูลค่าสุทธิทางบัญชี (Net Book Value):** ปรับลดสะสมทุกสิ้นงวดปีงบประมาณ บันทึกลงสมุดรายวันทั่วไป (GL) และงบทดลอง (Trial Balance) อัตโนมัติ

### 16.3 ฟังก์ชันและส่วนประกอบใหม่บนระบบ
1. **Footer Compliance Section (src/app/layout.tsx):**
   - เพิ่มรายการกำกับดูแล: บัญชีราคามาตรฐานครุภัณฑ์ สำนักงบประมาณ & เกณฑ์ สธ.
   - เพิ่มรายการกำกับดูแล: การกำหนดรหัสครุภัณฑ์ มาตรฐานกรมบัญชีกลาง & สธ.
2. **Master Data Hub (/workspace/admin/master-data):**
   - **แท็บ 4 (บัญชีราคามาตรฐานครุภัณฑ์):** แสดง 10 รายการครุภัณฑ์การแพทย์หลักพร้อมสเปกและเพดานราคาฉบับปี 2569
   - **แท็บ 5 (การกำหนดรหัสครุภัณฑ์ & Asset Tag):** เครื่องมือสร้างรหัสครุภัณฑ์อัตโนมัติ, เครื่องคิดเลขค่าเสื่อมราคา, และป้ายจำลองทรัพย์สินราชการ (Metal Tag with Code-128 & QR Code) พร้อมสั่งพิมพ์
3. **API Route /api/admin/equipment-standards:** รองรับการดึงข้อมูลบัญชีมาตรฐานและคำนวณค่าเสื่อมราคา
4. **HOS-AI Knowledge Injection:** ผนวกกฎราคามาตรฐานสำนักงบประมาณและโครงสร้างรหัส ว.106 เข้าสู่ AI Copilot บน MSI DGX

---

## 📹 17. คำสั่งปฏิบัติการระยะที่ 14 (PHASE 14: MDES CCTV & COMPUTER PROCUREMENT STANDARDS)

> **[วัตถุประสงค์ & เกณฑ์มาตรฐานกระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม (MDES)]:**  
> ยกระดับการจัดหาระบบเทคโนโลยีสารสนเทศ กล้องโทรทัศน์วงจรปิด และอุปกรณ์คอมพิวเตอร์ของสถานพยาบาลภาครัฐ ให้สอดคล้องตามเกณฑ์ราคากลางและคุณลักษณะพื้นฐานของกระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม (ฉบับปีงบประมาณ พ.ศ. 2568 - 2569) ป้องกันการจัดซื้อเกินเพดานราคากลาง และรับรองว่าอุปกรณ์มีสเปกที่ผ่านการรับรองความมั่นคงปลอดภัยภาครัฐ

### 17.1 เกณฑ์ราคากลางระบบกล้องโทรทัศน์วงจรปิด (CCTV) กระทรวงดีอี
- **หมวดรหัสครุภัณฑ์:** \7020\ (ระบบโทรทัศน์วงจรปิดและอุปกรณ์รักษาความปลอดภัย)
- **รายการมาตรฐานและเพดานราคากลาง:**
  1. กล้องเครือข่ายมุมมองคงที่ภายนอกอาคาร 2MP (Outdoor Fixed 1080p, IR 30m, IP67): **฿6,500.00**
  2. กล้องเครือข่ายมุมมองคงที่ความละเอียดสูง 4MP (True WDR 120dB, AI Analytics): **฿8,800.00**
  3. กล้องปรับมุมมองได้ Speed Dome PTZ (Optical Zoom ≥ 25x, IR 150m): **฿38,000.00**
  4. เครื่องบันทึกภาพผ่านเครือข่าย NVR 16 ช่อง (PoE Built-in, H.265+): **฿18,500.00**
  5. เครื่องบันทึกภาพผ่านเครือข่าย NVR 32 ช่อง (Enterprise 4-Bay, RAID Support): **฿34,000.00**
  6. จอแสดงผลระบบ CCTV ขนาด 43 นิ้ว (Professional 24/7, 4K UHD): **฿14,500.00**
- **มาตรฐานรับรอง:** Onvif Profile S, IP66/IP67, IK10, เปิดทำงานต่อเนื่องตลอด 24 ชั่วโมง

### 17.2 เกณฑ์ราคากลางการจัดหาอุปกรณ์คอมพิวเตอร์ กระทรวงดีอี
- **หมวดรหัสครุภัณฑ์:** \7010\ (ครุภัณฑ์คอมพิวเตอร์และระบบเครือข่าย)
- **รายการมาตรฐานและเพดานราคากลาง:**
  1. เครื่องคอมพิวเตอร์สำหรับงานสำนักงาน (จอ ≥ 21.5\", Core ≥ 4 Cores, RAM 8GB, SSD 250GB): **฿17,000.00**
  2. เครื่องคอมพิวเตอร์สำหรับงานประมวลผล (จอ ≥ 21.5\", Core ≥ 6 Cores, RAM 16GB, SSD 500GB): **฿22,000.00**
  3. เครื่องคอมพิวเตอร์โน้ตบุ๊กสำหรับงานสำนักงาน (RAM 16GB, SSD 512GB, จอ 14\" FHD): **฿21,000.00**
  4. เครื่องคอมพิวเตอร์โน้ตบุ๊กสำหรับงานประมวลผล (Dedicated GPU สำหรับ PACS/เวชระเบียน): **฿28,000.00**
  5. เครื่องสำรองไฟฟ้า UPS 800VA (Line Interactive with Stabilizer): **฿2,500.00** (อายุใช้งาน 3 ปี)
  6. เครื่องสำรองไฟฟ้า UPS 1000VA True Online (Pure Sine Wave สำหรับตู้ Rack): **฿7,500.00** (อายุใช้งาน 3 ปี)
  7. อุปกรณ์กระจายสัญญาณไร้สาย Wi-Fi 6 Enterprise Access Point (Dual Band, PoE+): **฿12,000.00**

### 17.3 การปรับปรุงและเชื่อมต่อระบบ
- **Footer Compliance (src/app/layout.tsx):** แสดงทั้งเกณฑ์ CCTV และเกณฑ์คอมพิวเตอร์ MDES ครบถ้วน
- **Master Data Hub (/workspace/admin/master-data):** เพิ่มแคตตาล็อก ตัวกรองมาตรฐาน และป้ายกำกับหน่วยงาน (MDES CCTV, MDES IT)
- **HOS-AI Knowledge Injection (src/server/lib/ai-assistant.ts):** AI Copilot บน MSI DGX สามารถให้คำปรึกษาและตรวจเช็คราคาตามเกณฑ์ MDES แบบเรียลไทม์

---

## 📚 18. คำสั่งปฏิบัติการระยะที่ 15 (PHASE 15: COMPREHENSIVE HOSPITAL ASSETS & REGULATORY STANDARDS EXPANSION)

> **[วัตถุประสงค์ & การขยายข้อมูลระดับโรงพยาบาลศูนย์ตติยภูมิ 1,000+ เตียง]:**  
> ปรับปรุงและขยายฐานข้อมูลมาตรฐานครุภัณฑ์ ทะเบียนสินทรัพย์ และเกณฑ์ราคากลางภาครัฐจากระดับตัวอย่าง สู่ระดับการใช้งานจริงแบบครบวงจร (Enterprise-grade Hospital Master Data) ครอบคลุม 44 รายการมาตรฐาน, 6 หมวดหมู่หลัก, ทะเบียนสินทรัพย์ครุภัณฑ์ที่โรงพยาบาลครอบครองจริง (Active Fixed Asset Register) พร้อมระบบคำนวณมูลค่าสุทธิทางบัญชี (Net Book Value) ตามเกณฑ์กระทรวงการคลัง

### 18.1 สรุปหมวดหมู่และรายการมาตรฐานในระบบ (44 รายการ)
1. **ครุภัณฑ์การแพทย์และวิทยาศาสตร์ (สำนักงบประมาณ & เกณฑ์ สธ. 20 รายการ):**
   - *กลุ่มผู้ป่วยวิกฤต (ICU/NICU):* เครื่องช่วยหายใจชนิดควบคุมปริมาตรและความดัน (฿850k), เครื่องช่วยหายใจความถี่สูงทารก HFOV (฿1.4M), เครื่องติดตามสัญญาณชีพ 5 พารามิเตอร์ (฿180k), Infusion Pump (฿45k), Syringe Pump (฿38k)
   - *กลุ่มอุบัติเหตุ-ฉุกเฉิน (ER):* เครื่องกระตุกหัวใจ Biphasic Defibrillator (฿320k), เครื่องช่วยฟื้นคืนชีพปั๊มหัวใจอัตโนมัติ Auto CPR (฿650k)
   - *กลุ่มห้องผ่าตัด & วิสัญญี (OR):* เตียงผ่าตัดไฟฟ้า-ไฮดรอลิก (฿1.2M), เครื่องดมยาสลบพร้อมเครื่องช่วยหายใจขั้นสูง (฿1.8M), โคมไฟผ่าตัดใหญ่คู่ LED กล้อง HD (฿750k), เครื่องจี้ตัดห้ามเลือด ESU (฿450k)
   - *กลุ่มรังสีวิทยาและวินิจฉัย (Radiology):* เครื่องตรวจคลื่นเสียงความถี่สูง 4D Ultrasound (฿2.5M), เครื่องเอกซเรย์ดิจิทัล 500mA (฿3.8M), เครื่องเอกซเรย์เคลื่อนที่ซีอาร์ม C-Arm (฿2.6M)
   - *กลุ่มงานสนับสนุนทางการแพทย์:* เครื่องนึ่งฆ่าเชื้อ Autoclave 300L Pass-Through (฿1.8M), เครื่องตรวจวิเคราะห์สารเคมีในเลือดอัตโนมัติ Clinical Chemistry (฿2.4M), ตู้เก็บรักษาเลือด 4°C Blood Bank (฿180k), ยูนิตทำฟัน Dental Unit (฿450k)
   - *กลุ่มยานพาหนะฉุกเฉิน (EMS 1669):* รถพยาบาลกู้ชีพฉุกเฉินระดับสูง ALS (฿2.45M), รถพยาบาลฉุกเฉินระดับพื้นฐาน BLS (฿1.65M)

2. **ระบบกล้องโทรทัศน์วงจรปิด CCTV (เกณฑ์กระทรวงดีอี MDES 10 รายการ):**
   - กล้องเครือข่ายภายนอก 2MP (฿6.5k), กล้อง 4MP WDR AI (฿8.8k), กล้องโดมภายใน 2MP (฿5.2k), Speed Dome PTZ ซูม 25x/30x (฿38k), กล้องอ่านป้ายทะเบียน LPR/ANPR (฿29k)
   - เครื่องบันทึกภาพ NVR 16 ช่อง PoE (฿18.5k), NVR 32 ช่อง Enterprise RAID (฿34k), NVR 64 ช่อง Redundant PSU (฿58k)
   - จอแสดงผล CCTV 43 นิ้ว (฿14.5k), จอ 55 นิ้ว Video Wall (฿24k)

3. **ครุภัณฑ์คอมพิวเตอร์และระบบเครือข่าย (เกณฑ์กระทรวงดีอี MDES 14 รายการ):**
   - Desktop สำนักงาน (฿17k), Desktop ประมวลผล HIS (฿22k), All-in-One ประจำเคาน์เตอร์พยาบาล (฿23.5k)
   - Notebook สำนักงาน (฿21k), Notebook ประมวลผลภาพ PACS (฿28k)
   - Server Rack 1U (฿140k), Server Rack 2U Enterprise Dual CPU (฿260k)
   - UPS 800VA (฿2.5k), UPS 1000VA True Online (฿7.5k), UPS 3000VA Data Center (฿28k)
   - Wi-Fi 6 Enterprise AP (฿12k), Managed Switch 24-Port PoE+ (฿19.5k)
   - เครื่องพิมพ์เลเซอร์มัลติฟังก์ชัน (฿9.9k), เครื่องพิมพ์บาร์โค้ดสายรัดข้อมือและฉลากยา (฿12.5k)

### 18.2 ทะเบียนสินทรัพย์ครุภัณฑ์จริง (Hospital Active Fixed Asset Register)
- บันทึกประวัติเครื่องจักรและอุปกรณ์ที่โรงพยาบาลครอบครองจริง พร้อมรหัสครุภัณฑ์ตามมาตรฐาน ว.106
- ติดตามหมายเลขซีเรียลเครื่อง (S/N), แผนกผู้รับผิดชอบ, สถานที่ติดตั้ง, วันที่ตรวจรับ, วันสิ้นสุดการรับประกัน, และราคาทุนจัดหา
- คำนวณค่าเสื่อมราคาสะสมและมูลค่าสุทธิทางบัญชี (Net Book Value) ตามวิธีเส้นตรง (Straight-line) ราคาซาก ฿1.00 บาท อัตโนมัติทุกรายการ

---

## 📜 19. คำสั่งปฏิบัติการระยะที่ 16 (PHASE 16: STRICT OFFICIAL CIRCULAR COMPLIANCE & CURRENT REGULATORY CERTIFICATION)

> **[นโยบายข้อมูลฉบับล่าสุดและเป็นปัจจุบันเท่านั้น - STRICT CURRENT OFFICIAL STANDARDS]:**  
> ปรับปรุงฐานข้อมูล อ้างอิงทางกฎหมาย และหนังสือเวียนราชการทุกฉบับในระบบให้เป็น **"ข้อมูลฉบับล่าสุดและเป็นปัจจุบัน 100%"** ตรวจสอบยันกับราชกิจจานุเบกษาและหนังสือเวียนทางการของสำนักงบประมาณ กระทรวงดีอี และกรมบัญชีกลาง

### 19.1 รายการหนังสือเวียนทางการฉบับล่าสุดที่มีผลบังคับใช้ (Official Circular Authority)
1. **สำนักงบประมาณ สำนักนายกรัฐมนตรี:**
   - **หนังสือเวียน:** หนังสือสำนักงบประมาณ ด่วนที่สุด ที่ **นร 0719.1/ว 53 ลงวันที่ 4 ธันวาคม พ.ศ. 2568**
   - **สถานะ:** บัญชีราคามาตรฐานครุภัณฑ์ ฉบับเดือนธันวาคม 2568 (มีผลบังคับใช้สำหรับการจัดทำและบริหารงบประมาณรายจ่ายประจำปีงบประมาณ พ.ศ. 2569)
   - **ขอบเขต:** ควบคุมเพดานราคากลางครุภัณฑ์การแพทย์ วิทยาศาสตร์ และยานพาหนะพยาบาล ALS
2. **กระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม (เกณฑ์คอมพิวเตอร์ & IT):**
   - **หนังสือเวียน:** ประกาศกระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม เรื่อง เกณฑ์ราคากลางและคุณลักษณะพื้นฐานการจัดหาอุปกรณ์และระบบคอมพิวเตอร์ **ฉบับเดือนธันวาคม 2568 (ประกาศ ณ วันที่ 1 ธันวาคม พ.ศ. 2568)**
   - **สถานะ:** มีผลบังคับใช้เป็นเกณฑ์กลางสำหรับการจัดหาของส่วนราชการ รัฐวิสาหกิจ และหน่วยงานรัฐทุกแห่ง
   - **ขอบเขต:** คอมพิวเตอร์ประมวลผล HIS/PACS, โน้ตบุ๊ก, เซิร์ฟเวอร์ Enterprise, UPS True Online และเครือข่าย Wi-Fi 6
3. **กระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม (เกณฑ์ระบบกล้องโทรทัศน์วงจรปิด CCTV):**
   - **หนังสือเวียน:** เกณฑ์ราคากลางและคุณลักษณะพื้นฐานของระบบกล้องโทรทัศน์วงจรปิด (ฉบับมาตรฐานปรับปรุงประกอบเกณฑ์ไอที ธันวาคม 2568)
   - **สถานะ:** รองรับมาตรฐานกล้องเครือข่าย IP Camera, Onvif Profile S, มาตรฐานกันฝุ่นน้ำ IP66/IP67, กันกระแทก IK10
   - **ข้อกำหนดนิติวิทยาศาสตร์ดิจิทัล:** บังคับเทียบเวลาระบบบันทึก NVR ผ่าน Network Time Protocol (NTP) กับเวลามาตรฐานประเทศไทย สถาบันมาตรวิทยาแห่งชาติ (`time1.nimt.or.th`)
4. **กรมบัญชีกลาง กระทรวงการคลัง (การกำหนดรหัสครุภัณฑ์ & ค่าเสื่อมราคา):**
   - **หนังสือเวียน:** หนังสือกรมบัญชีกลาง ด่วนที่สุด ที่ **กค 0405.2/ว 106 และ ว 119**
   - **สถานะ:** โครงสร้างรหัส New GFMIS Thai รูปแบบ `[หมวด 4 หลัก]-[ชนิด 3 หลัก]-[รายการ 4 หลัก]-[ปีงบประมาณ 4 หลัก]/[หมายเลขลำดับ 4 หลัก]`
   - **การคิดค่าเสื่อมราคา:** วิธีเส้นตรง (Straight-line Depreciation) โดยหักราคาซาก (Salvage Value) = **฿1.00 บาท** ตามระเบียบกระทรวงการคลังว่าด้วยการบริหารพัสดุฯ

### 19.2 จุดที่ทำการปรับปรุงและเชื่อมโยงในระบบ (Full System Integration)
- **Footer Compliance (`src/app/layout.tsx`):** แสดงรายการกฎหมายและหนังสือเวียนฉบับล่าสุดครบถ้วน พร้อมระบุเลขที่ ว 53, ว 106, และประกาศ MDES 1 ธ.ค. 2568
- **Master Data Hub (`src/app/workspace/admin/master-data/page.tsx`):**
  - ติดตั้งแถบ **Official Verification Status Ribbon (Verified & Current 100%)** สีเขียวมรกต ยืนยันความถูกต้องของฐานข้อมูล
  - แสดงป้ายกำกับเลขที่หนังสือเวียนทางการ (`item.officialCircularRef`) ในทุกแถวของตารางแคตตาล็อก
- **API Endpoint (`src/app/api/admin/equipment-standards/route.ts`):** ส่งมอบฟิลด์ `verification` และ `LATEST_OFFICIAL_EDITIONS` ยืนยันสถานะความถูกต้องต่อระบบภายนอก
- **HOS-AI Copilot (`src/server/lib/ai-assistant.ts`):** ป้อน Knowledge Base กฎหมายและหนังสือเวียนฉบับล่าสุด ให้ AI อ้างอิงเลขที่หนังสือได้อย่างแม่นยำในการให้คำปรึกษาและร่างเอกสาร
- **ระบบ AgentsRoom:** บันทึกและปิดงาน Ticket #25 (`e354fb70-38e7-45d1-914a-b216fc1bb707`) สู่สถานะ `done` สำเร็จเรียบร้อย
- **Production Server Deployment:** อัปเดตและคอมไพล์ผ่าน 100% บนเครื่อง **MSI DGX Supercomputer (`192.168.1.224:3080`)** ทำงานปกติภายใต้ `systemd`
