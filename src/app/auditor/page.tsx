// /auditor — สตง. / ป.ป.ช. read-only forensic console
//   * PDPA masked HN/AN only (v_audit_consignment_masked)
//   * Audit hash chain (prev_hash / row_hash) + daily Merkle root
//   * Dynamic watermark: auditor identity + timestamp on screen
import { AuditChainDemo } from "./audit-chain";

const shell: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif", maxWidth: 1000, margin: "0 auto",
  padding: "24px 20px 60px", background: "#F8FAFC", minHeight: "100vh",
};

export default function AuditorPage() {
  const stamp = new Date().toISOString();
  const auditorId = "AUDIT-2026-STA-0001"; // in production: from session claim

  return (
    <main style={shell}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1,
        display: "grid", placeItems: "center", opacity: 0.06,
        transform: "rotate(-18deg)",
      }} aria-hidden>
        <div style={{ fontSize: 90, fontWeight: 700, color: "#1E3A8A", whiteSpace: "nowrap" }}>
          {auditorId} · {stamp}
        </div>
      </div>

      <header style={{
        position: "relative", display: "flex", justifyContent: "space-between",
        alignItems: "baseline", borderBottom: "2px solid #1E3A8A", paddingBottom: 10,
      }}>
        <h1 style={{ fontSize: 20, color: "#1E3A8A", margin: 0 }}>
          Audit Console — สตง. / ป.ป.ช. (Read-Only, Zero-Trust)
        </h1>
        <span style={{ fontSize: 12, color: "#6B7280" }}>
          watermark: <code>{auditorId}</code> · <code>{stamp}</code>
        </span>
      </header>

      <p style={{ fontSize: 13, color: "#374151", marginTop: 12, lineHeight: 1.6 }}>
        ผู้ตรวจสอบเห็นว่าเฉพาะข้อมูล PDPA-masked (HN/AN) ผ่าน view
        <code> v_audit_consignment_masked</code> เท่านั้น — ไม่มีการเขียนข้อมูล,
        ไม่มีการ export raw; ทุก action ของหน้า pageload ถูก log
        (actor=<code>{auditorId}</code>) เข้า audit hash chain พร้อม
        <code> prev_hash / row_hash</code> ต่อด้วย Merkle root รายวัน
      </p>

      <AuditChainDemo />
    </main>
  );
}
