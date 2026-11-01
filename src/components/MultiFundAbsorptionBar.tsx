// MultiFundAbsorptionBar — segmented bar of the 5 canonical budget states
// Allocated / Pre-Encumbered (DB: PRE_ENCUMBERED) / Encumbered /
// Carry-Over Encumbered / Disbursed — cross-agent contract with KPI JSON Schema
interface StateSegment {
  key: "allocated" | "preEncumbered" | "encumbered" | "carryOverEncumbered" | "disbursed";
  labelTh: string;
  amount: number;
  color: string;
}

interface Props {
  fundCode?: string;
  fundName?: string;
  label?: string;
  states: {
    allocated: number;
    preEncumbered: number;
    encumbered: number;
    carryOverEncumbered: number;
    disbursed: number;
  };
}

const SEGMENTS: Omit<StateSegment, "amount">[] = [
  { key: "allocated",            labelTh: "Allocated",              color: "#1E3A8A" },
  { key: "preEncumbered",        labelTh: "Pre-Encumbered",         color: "#0EA5E9" },
  { key: "encumbered",           labelTh: "Encumbered",             color: "#D97706" },
  { key: "carryOverEncumbered",  labelTh: "Carry-Over Encumbered",  color: "#7C3AED" },
  { key: "disbursed",            labelTh: "Disbursed",              color: "#059669" },
];

const baht = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 }).format(n);

export function MultiFundAbsorptionBar({ fundCode, fundName, label, states }: Props) {
  const displayTitle = label ?? fundName ?? fundCode ?? "กองทุนโรงพยาบาล";
  const total = SEGMENTS.reduce((s, seg) => s + states[seg.key], 0);
  if (total <= 0) {
    return (
      <div style={{ color: "#9CA3AF", fontSize: 13, padding: 8 }}>
        {displayTitle} — ยังไม่มีวงเงิน
      </div>
    );
  }
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <strong style={{ color: "#1E3A8A" }}>{displayTitle}</strong>
        <span style={{ color: "#6B7280", fontVariantNumeric: "tabular-nums" }}>{baht(total)}</span>
      </div>
      <div style={{
        display: "flex", height: 14, borderRadius: 7, overflow: "hidden",
        border: "1px solid #E5E7EB",
      }} role="img" aria-label={`${displayTitle} fund state bar`}>
        {SEGMENTS.map((seg) => {
          const pct = (states[seg.key] / total) * 100;
          return pct > 0 ? (
            <div key={seg.key} title={`${seg.labelTh}: ${baht(states[seg.key])} (${pct.toFixed(1)}%)`}
                 style={{ width: `${pct}%`, background: seg.color }} />
          ) : null;
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 6, fontSize: 12 }}>
        {SEGMENTS.map((seg) => (
          <span key={seg.key} style={{ color: "#374151" }}>
            <span style={{
              display: "inline-block", width: 10, height: 10, borderRadius: 2,
              background: seg.color, marginRight: 6, verticalAlign: "middle",
            }} />
            {seg.labelTh}{" "}
            <span style={{ fontVariantNumeric: "tabular-nums", color: "#111827" }}>
              {baht(states[seg.key])}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
