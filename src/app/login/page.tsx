"use client";
// /login — Step 1: L1 Argon2id credentials → Step 2: MOPH Provider ID (OIDC PKCE)
// After step 1 succeeds we open MophProviderId2FAModal and drive the browser
// to the MOPH authorization endpoint; the provider-callback route finishes
// the session (nonce + hcode === HOSPITAL_HCODE + council_code).
import { useState } from "react";
import { MophProviderId2FAModal } from "@/components/MophProviderId2FAModal";

const box: React.CSSProperties = {
  width: 420, background: "#fff", border: "1px solid #E5E7EB",
  borderRadius: 14, padding: 28, fontFamily: "system-ui, sans-serif",
  boxShadow: "0 10px 30px rgba(15,23,42,.08)",
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step1Token, setStep1Token] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitStep1(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      setStep1Token(data.step1Token); // opens the MOPH Provider ID modal
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh", display: "grid", placeItems: "center",
      background: "linear-gradient(180deg,#EFF6FF,#F8FAFC)",
    }}>
      <div style={box}>
        <div style={{ fontSize: 12, color: "#D97706", fontWeight: 600 }}>
          หน่วยงานรัฐวิสาหกิจ — ระบบ e-Procurement โรงพยาบาล
        </div>
        <h1 style={{ margin: "6px 0 4px", fontSize: 22, color: "#1E3A8A" }}>
          เข้าสู่ระบบ (2-Step Auth)
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>
          Step 1 — ชื่อผู้ใช้ + รหัสผ่าน (Argon2id)
          {" · "}Step 2 — MOPH Health ID / Provider ID
        </p>

        <form onSubmit={submitStep1} style={{ marginTop: 18 }}>
          <label style={{ display: "block", fontSize: 13, color: "#374151" }}>
            ชื่อผู้ใช้ (staff code)
            <input style={{
              marginTop: 4, width: "100%", boxSizing: "border-box",
              border: "1px solid #D1D5DB", borderRadius: 8, padding: "10px 12px",
            }} value={username} autoComplete="username"
               onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label style={{ display: "block", fontSize: 13, color: "#374151", marginTop: 12 }}>
            รหัสผ่าน
            <input style={{
              marginTop: 4, width: "100%", boxSizing: "border-box",
              border: "1px solid #D1D5DB", borderRadius: 8, padding: "10px 12px",
            }} type="password" value={password} autoComplete="current-password"
               onChange={(e) => setPassword(e.target.value)} />
          </label>

          {error && (
            <div role="alert" style={{
              marginTop: 12, color: "#DC2626", background: "#FEF2F2",
              border: "1px solid #FECACA", borderRadius: 8,
              padding: "8px 10px", fontSize: 13,
            }}>{error}</div>
          )}

          <button type="submit" disabled={busy} style={{
            marginTop: 18, width: "100%", background: "#1E3A8A", color: "#fff",
            border: "none", borderRadius: 8, padding: "11px 0",
            fontSize: 15, cursor: busy ? "wait" : "pointer",
          }}>{busy ? "กำลังตรวจสอบ…" : "ตรวจสอบรหัสผ่าน → Step 2"}</button>
        </form>

        <div style={{
          marginTop: 16, fontSize: 11, color: "#9CA3AF", lineHeight: 1.5,
        }}>
          Rate limit: 5 ครั้ง/นาที · ล็อก 15 นาทีหลังล้มเหลว 10 ครั้ง
        </div>
      </div>

      {step1Token && (
        <MophProviderId2FAModal
          step1Token={step1Token}
          onClose={() => setStep1Token(null)}
          onDone={() => { window.location.href = "/dashboard"; }}
        />
      )}
    </main>
  );
}
