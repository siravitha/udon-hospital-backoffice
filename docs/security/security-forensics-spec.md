# HOS-BACKOFFICE — Security & Forensics Specification

**Scope:** e-Procurement ระบบโรงพยาบาลภาครัฐ (≥1,000 เตียง) — กลไก Dual Auth, audit hash chain + Merkle + WORM, e-signature PAdES-LTV/RFC 3161, Zero-Trust read-only สำหรับ สตง./ป.ป.ช., และกรณีทดสอบ security (Shared Fixture)
**Companion DDL:** `db/migrations/001_hospital_eprocurement_schema.sql` (ชื่อคอลัมน์ canonical: `prev_hash` / `row_hash` — สเปคนี้ใช้อันเดียวกัน)
**Companion code:** `src/server/auth/*`, `src/server/engines/*`, API routes `src/app/api/*`

---

## 1. Threat Model — STRIDE

### 1.1 Privilege Escalation on Budgets (Threat #1)
- **Scenario:** ผู้ใช้สิทธิ budget approver พยายามอนุมัติ PR ที่เกิน fund/CC ของตน, หรือเปลี่ยน fund source หลัง APPROVED เพื่อ dodge quota.
- **Controls:**
  - RLS: ผู้ใช้เห็น/เขียนเฉพาะ cost_center ใน scope (policy `cc_scoped`) + row-level state guard.
  - Step-Up 2FA (token 5-min, one-time) ย่อมจำเป็นก่อน `APPROVE_BUDGET` / `APPROVE_PR` — API คืน 401 `{need:"STEPUP_2FA"}` เมื่อไม่มี token.
  - `SELECT ... FOR UPDATE ORDER BY budget_id ASC` กัน TOCTOU race ระหว่าง fund 2 ใบ.
  - Trigger `trg_budget_encumbrance_sync` คำนวณ reserve/refund ใน DB — client คำนวณเองไม่ได้.
  - Audit: ทุก PR.APPROVE / BUDGET.* เข้า hash chain.
- **Residual risk:** แอดมิน DB โดยตรง → Mitigate ด้วย WORM partition + Merkle root ส่งออกนอกเครื่อง (off-site anchor) รายวัน.

### 1.2 Middle-Price Tampering (Threat #2)
- **Scenario:** กรรมการทักท้วง → ผู้ขายปรับราคา "กลางวงเงิน" ให้หลุดจากเกณฑ์ e-bidding/ราคาากลาง (middle price) หรือ cluster รอบ 490k–499.9k (split purchase).
- **Controls:**
  - `middle_price_disclosures` (BG01–BG06) + NLEM price เป็น source-of-truth, read-only ใน runtime; 3-Way Match gate เทียบ invoice vs PO vs contract.
  - `fn_detect_hospital_procurement_anomalies` detect:
    - `SPLIT_PURCHASE` (รวม < 500k ใน 30 วัน),
    - `AMOUNT_CLUSTERING` (490,000.00–499,900.00),
    - `COI_COMMITTEE` (กรรมการมี COI),
    - `PRICE_OVER_NLEM`.
  - ทุกการแก้ราคาต้องผ่าน Legal Desk + DiffViewer (side-by-side, hash snapshot ก่อน/หลัง) — audit row.
- **Verification:** fixture + anomaly function runs in CI (NODE_ENV=test).

### 1.3 Phantom Consignment Billing (Threat #3)
- **Scenario:** HIS/WH webhook ถูก replay หรือ forge — เรียกเก็บ OR Consignment ที่ไม่ได้เกิดจริง (Phantom billing).
- **Controls:**
  - **Idempotency contract:** same key + same body → 200 replay (idempotent) · same key + different body → **422 IdempotencyConflict** (DB UNIQUE `idempotency_key` เป็น backstop).
  - Body fingerprint = SHA-256 ของ canonical fields (item, qty, unit, hn, an) — กัน body mutation.
  - HN/AN PDPA-masked ก่อน persist; raw ไม่เก็บ.
  - Inspection committee (PASS/FAIL/OBJECTION) gate ก่อน voucher; OBJECTION → voucher SUSPENDED (trigger `trg_inspection_objection_suspends`).
  - Webhook endpoint: mTLS + HMAC signature + IP allow-list (นอก schema นี้, deployment config).
- **Verification:** replay test ใน `blanket-consignment.engine.ts`.

### 1.4 e-LG Webhook Attack (Threat #4)
- **Scenario:** attacker forge status change จาก e-LG (ประกวดราคา) — ยกเลิก/เปลี่ยนผู้ชนะหลัง contract sealed.
- **Controls:**
  - e-LG integration เป็น **inbound-only event** → map to internal state transition ที่มี whitelist, ห้ามเขียน state ที่ถูก seal แล้ว.
  - ทุก event ถูก append เข้า audit hash chain + Merkle root รายวัน; divergence เทียบกับ off-site anchor → alarm.
  - Step-Up `APPROVE_PR` + dual approval สำหรับ EMERGENCY_RETROSPECTIVE_PR.

### 1.5 Other STRIDE (summary)
| STRIDE | Threat | Key control |
|---|---|---|
| Spoofing | fake MOPH ID token | OIDC PKCE, RS256/ES256 only, iss/exp/nonce, hcode 5-digit === HOSPITAL_HCODE + council_code |
| Tampering | voucher/invoice | 3-Way Match gate, DB triggers, hash chain |
| Repudiation | "ไม่ได้สั่งจ่าย" | PAdES-LTV + RFC 3161 trusted TS |
| Info disclosure | HN/AN raw | PDPA mask at persistence + `v_audit_consignment_masked` |
| DoS | API | rate limit 5/min L1, lockout 15 min, Redis KPI cache |
| Elevation | role mixup | RLS + Step-Up 2FA + stepUpActions bound |

---

## 2. Dual-Authentication (L1 + L2)

### 2.1 Layer 1 — Local (Argon2id)
- KDF: **Argon2id, m = 64 MiB, t = 3, p = 4** (canonical: `ARGON2_OPTIONS` in `local-auth.service.ts`).
- Rate limit: **5 ครั้ง/นาที** ต่อ username (Redis `INCR` + `EXPIRE 60`).
- Lockout: **15 นาที** หลังล้มเหลว **10 ครั้ง**.
- Unknown user: constant-time dummy verify — กัน username enumeration; timing-safe hex compare.

### 2.2 Layer 2 — MOPH Provider ID (OIDC PKCE)
- Auth code flow + **PKCE S256** (`code_challenge`), RSA/EC (`RS256`/`ES256` only).
- Token validation: `iss` ของ MOPH, `exp`, `nonce` (server-side store), `hcode` pattern `/^\d{5}$/` **=== HOSPITAL_HCODE**, `council_code` มีอยู่จริง.
- Complete session: upsert user moph fields + audit row `L2_MOPH_OIDC`.

### 2.3 Step-Up 2FA (high-risk actions)
- Token: SHA-256 hashed, **TTL 5 นาที, one-time**, bind action+user.
- ต้องใช้ก่อน: `APPROVE_BUDGET`, `APPROVE_PR`, `SIGN_PADES`, `EMERGENCY_CASE`, `TRANSFER_FUNDS`.
- API: ไม่มี token → `401 { need:"STEPUP_2FA" }` · token reuse → `401 STEPUP_INVALID`.

### 2.4 Emergency Case
- `EMERGENCY_RETROSPECTIVE_PR` — SLA **3 วันทำการ** post-hoc, **dual approval** (budget + procurement), audit row + watermark.

---

## 3. Audit Log — Hash Chain + Merkle + WORM

### 3.1 Schema (canonical names)
- Table: `system_audit_logs` — **PARTITION BY RANGE (occurred_at)**, partitions `y2026` / `y2027` + default.
- Cols: `occurred_at`, `actor`, `action`, `entity`, `payload jsonb`, **`prev_hash CHAR(64)`**, **`row_hash CHAR(64)`**.
- **Genesis:** `prev_hash = 64 zeros`.
- **`row_hash` = SHA-256(prev_hash || actor || action || entity || canonical_payload)** — `canonical_payload` = JSON keys sorted, no whitespace (deterministic).

### 3.2 Merkle Daily Root
- `fn_compute_daily_merkle_root(date)` → `merkle_daily_roots(date, root_hash, leaf_count)`.
- ส่งออก off-site (ETDA/audit anchor) รายวัน — divergence เทียบกับ off-site anchor → alarm.

### 3.3 WORM posture
- DB: partitioned + no DELETE grant สำหรับ runtime user.
- App: ไม่เปิด endpoint ลบ audit; audit append-only.
- Off-site: signed export (RFC 3161) วันต่อวัน.

### 3.4 Auditor Console (Zero-Trust Read-Only)
- `auditor/page.tsx` — เห็น PDPA-masked HN/AN ผ่าน `v_audit_consignment_masked` เท่านั้น.
- **Dynamic watermark:** auditor identity + ISO timestamp overlay (CSS rotate, pointer-events:none) — กัน screenshot exfil.
- ทุก pageload/action ของ auditor ถูก log เข้า chain (actor=`AUDIT-…`).

---

## 4. E-Signature — PAdES-LTV + RFC 3161 (พ.ร.บ. e-Doc 2544)
- Signing profile: **PAdES-LTV** (Long-Term Validation) + **trusted TSA (RFC 3161)** — ETDA Act 2544 §9 (ความมีผลของลายเซ็น) / §26 (e-Signature Provider).
- Use cases: ตรวจรับ (receiving inspection), PAdES-signed inspection (`pades_signed_at`, `pades_rfc3161_ts` ใน `receiving_inspections`).
- Step-Up `SIGN_PADES` ย่อมจำเป็น.
- Key: HSM/SM2 หรือ PKCS#11 token — ไม่เก็บ raw key ใน app.

---

## 5. PDPA Anonymization
- HN/AN: mask ที่ **persistence** (first 2 chars + `***`) — raw ไม่เก็บ.
- Auditor/external: เห็นผ่าน `v_audit_consignment_masked` เท่านั้น.
- Consent/legitimate-interest record ใน `auth_sessions_audit` + user profile.

---

## 6. KPI & Performance SLO
- Redis cache: `kpi:exec:{date}:{fund_filter_hash}` TTL **300 s**, stale-while-revalidate.
- Source: materialized view `mv_executive_dashboard_kpis` (5 fund × 5 state + pipeline + sla).
- SLO: **P99 < 50 ms** — violation → header `x-kpi-slo-violation: true` + warn log.

---

## 7. Security Test Cases (must run in CI)

### 7.1 **SHARED FIXTURE — 3-Way Match / Tax / Net Payable**
| Field | Value |
|---|---|
| Incl-VAT (ตั้งเบิก) | **1,070,000.00** |
| Ex-VAT = Incl × 100/107 | **1,000,000.00** |
| VAT 7% | **70,000.00** |
| WHT 1% (PRIVATE) | **10,000.00** |
| Penalty | **50,000.00** |
| **Net Payable** | **1,010,000.00** |

- DB: DO-block ใน `001_hospital_eprocurement_schema.sql` — `RAISE EXCEPTION 'FIXTURE FAIL …'` ถ้า `v_net <> 1010000.00`.
- Backend: `runSharedFixtureCheck()` ใน `three-way-match-tax.engine.ts` (auto-run เมื่อ `NODE_ENV=test`).
- Frontend: `ThreeWayMatchCard isFixture` render ตัวเลขชุดนี้ + "✓ Fixture match".
- GPO / GOV / RED_CROSS: WHT = **0** (`whtExemptReason`).

### 7.2 Standstill & Penalty
- Standstill open → Call-Off = **423 Locked** + `retry-after`.
- Penalty: `0.5% × elapsed_working_days × contract_value`, cap **10%** → `state: PENALTY_CAPPED`; inspection_days ถูกหัก.

### 7.3 Idempotency
- Same key + same body → **200** (idempotent, `replayed:true`).
- Same key + different body → **422 IdempotencyConflict**.

### 7.4 Rate limit / Lockout
- 6 ครั้งใน 60 s → **429** · 10 fails → lockout **15 นาที** → **423**.

### 7.5 Step-Up 2FA
- ไม่มี token → **401 `{need:"STEPUP_2FA"}`** · reuse → **401 `STEPUP_INVALID`**.

### 7.6 MOPH Provider
- hcode ≠ HOSPITAL_HCODE → **`HCODE_MISMATCH`** · nonce mismatch → **`ID_TOKEN_INVALID`**.

### 7.7 Anomaly detection
- Split < 500k in 30d → `SPLIT_PURCHASE` · 490k–499.9k cluster → `AMOUNT_CLUSTERING` · COI → `COI_COMMITTEE` · > NLEM → `PRICE_OVER_NLEM`.

---

## 8. Deployment Hardening Checklist
- [ ] PostgreSQL `listen_addresses` = internal only; runtime user **no DELETE** on `system_audit_logs` partitions.
- [ ] Redis TLS + ACL; KPI keys namespaced.
- [ ] Webhook endpoints: mTLS + HMAC + IP allow-list.
- [ ] Off-site Merkle anchor: signed export รายวัน (RFC 3161).
- [ ] Secrets: K8s Secrets / Vault — ห้าม hardcode.
- [ ] Logging: JSON structured, actor/action/entity — forward to SIEM.
- [ ] Dependency audit: `npm audit`, `pip audit` ใน CI.
- [ ] SLO monitoring: `x-kpi-slo-violation` → alert.

---

*Spec owner: SecurityLead · Review: Architect + DB Engineer · Approved: PM*
