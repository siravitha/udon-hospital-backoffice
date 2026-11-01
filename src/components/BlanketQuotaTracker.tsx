// BlanketQuotaTracker — shows remaining quota of a master blanket contract
// vs. total quota; warn when < 20% remains
interface Props {
  paNumber: string;
  vendorName: string;
  totalQuota: number;
  remainingQuota: number;
  unitPriceRef: number;
  effectiveTo: string; // ISO date
}

const baht = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 }).format(n);

export function BlanketQuotaTracker(p: Props) {
  const used = p.totalQuota - p.remainingQuota;
  const pctLeft = p.totalQuota > 0 ? (p.remainingQuota / p.totalQuota) * 100 : 0;
  const low = pctLeft < 20;
  const accent = low ? "#DC2626" : pctLeft < 50 ? "#D97706" : "#059669";
  return (
    <div style={{
      fontFamily: "system-ui, sans-serif", border: `1px solid ${accent}`,
      borderRadius: 10, padding: 16, background: "#fff",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
        <strong style={{ color: "#1E3A8A" }}>{p.paNumber} · {p.vendorName}</strong>
        <span style={{ color: "#6B7280", fontVariantNumeric: "tabular-nums" }}>
          {baht(p.remainingQuota)} / {baht(p.totalQuota)}
        </span>
      </div>
      <div style={{
        height: 10, borderRadius: 5, background: "#F3F4F6",
        marginTop: 8, overflow: "hidden",
      }}>
        <div style={{
          width: `${pctLeft}%`, height: "100%", background: accent,
          transition: "width 300ms ease",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 6 }}>
        <span style={{ color: "#6B7280" }}>
          คงเหลือ {pctLeft.toFixed(1)}% · ใช้ออกแล้ว {baht(used)}
        </span>
        <span style={{ color: "#6B7280", fontVariantNumeric: "tabular-nums" }}>
          ราคากลาง {baht(p.unitPriceRef)}
        </span>
      </div>
      {low && (
        <div style={{ color: "#DC2626", fontSize: 12, marginTop: 6 }}>
          ⚠ วงเงินเหลือ &lt; 20% — แจ้งฝ่ายจัดซื้อพิจารณาเพิ่ม quota หรือต่อสัญญา
        </div>
      )}
      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
        มีผลถึง {new Date(p.effectiveTo).toLocaleDateString("th-TH")}
      </div>
    </div>
  );
}
