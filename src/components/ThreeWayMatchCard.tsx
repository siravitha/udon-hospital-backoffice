// ThreeWayMatchCard — 3-Way Match + Tax result, with the SHARED FIXTURE row
// Incl-VAT 1,070,000.00 → Ex-VAT 1,000,000.00 · WHT 10,000.00
// Penalty 50,000.00 → Net Payable 1,010,000.00
interface Match {
  inclVat: number;
  exVat: number;
  vat: number;
  wht: number;
  whtExemptReason?: string | null;
  penalty: number;
  netPayable: number;
  vendorClass: "PRIVATE" | "GPO" | "GOV_AGENCY" | "RED_CROSS";
  matchOk: boolean;
}

const baht = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 }).format(n);

export function ThreeWayMatchCard({ m, isFixture = false }: { m: Match; isFixture?: boolean }) {
  const row: React.CSSProperties = {
    display: "flex", justifyContent: "space-between",
    padding: "6px 0", borderBottom: "1px solid #F3F4F6",
    fontVariantNumeric: "tabular-nums", fontSize: 14,
  };
  const accent = m.matchOk ? "#059669" : "#DC2626";
  return (
    <div style={{
      fontFamily: "system-ui, sans-serif", border: `2px solid ${accent}`,
      borderRadius: 12, padding: 16, background: "#fff", maxWidth: 520,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ color: "#1E3A8A", fontSize: 16 }}>
          {isFixture ? "SHARED FIXTURE — 3-Way Match" : "3-Way Match — Invoice"}
        </strong>
        <span style={{
          color: "#fff", background: accent, borderRadius: 999,
          padding: "2px 10px", fontSize: 12,
        }}>{m.matchOk ? "PASS" : "FAIL"}</span>
      </div>
      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
        Vendor class: <code>{m.vendorClass}</code>
        {m.whtExemptReason && <> · WHT exempt: <code>{m.whtExemptReason}</code></>}
      </div>

      <div style={row}><span>Incl-VAT (ตั้งเบิก)</span><strong>{baht(m.inclVat)}</strong></div>
      <div style={row}><span>Ex-VAT (= Incl-VAT × 100 / 107)</span><span>{baht(m.exVat)}</span></div>
      <div style={row}><span>VAT 7%</span><span>{baht(m.vat)}</span></div>
      <div style={row}><span>WHT 1% (ของ Ex-VAT)</span><span>{baht(m.wht)}</span></div>
      <div style={row}><span>Penalty (ส่งมอบล่าช้า)</span><span>{baht(m.penalty)}</span></div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        padding: "10px 0 0", fontSize: 16, borderTop: "2px solid #1E3A8A",
        fontVariantNumeric: "tabular-nums", marginTop: 6,
      }}>
        <strong style={{ color: "#1E3A8A" }}>Net Payable</strong>
        <strong style={{ color: accent }}>{baht(m.netPayable)}</strong>
      </div>

      {isFixture && (
        <div style={{
          marginTop: 12, fontSize: 12, color: "#374151",
          background: "#F0FDF4", border: "1px dashed #059669",
          borderRadius: 6, padding: "8px 10px",
        }}>
          <code>1,070,000.00 − 10,000.00 − 50,000.00 = 1,010,000.00</code>
          <div style={{ marginTop: 4, color: "#059669", fontWeight: 600 }}>
            {m.netPayable === 1_010_000 ? "✓ Fixture match — OK" : "✗ Fixture MISMATCH"}
          </div>
        </div>
      )}
    </div>
  );
}
