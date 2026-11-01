// ConsignmentUsageCard — one OR Consignment usage from HIS webhook
// HN/AN are PDPA-masked at persistence; card shows masked values only
interface Props {
  usageId: string;
  itemCode: string;
  itemNameTh: string;
  qtyUsed: number;
  unitPrice: number;
  orUnit: string;
  hnMasked: string;
  anMasked: string;
  processedAt: string; // ISO
  inspectionState: "PENDING" | "PASS" | "FAIL" | "OBJECTION";
}

const STATE_STYLE: Record<Props["inspectionState"], { color: string; label: string }> = {
  PENDING:   { color: "#D97706", label: "รอตรวจรับ" },
  PASS:      { color: "#059669", label: "ผ่านตรวจรับ" },
  FAIL:      { color: "#DC2626", label: "ไม่ผ่าน" },
  OBJECTION: { color: "#DC2626", label: "กรรมการทักท้วง — ระงับเบิกจ่าย" },
};

const baht = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 }).format(n);

export function ConsignmentUsageCard(p: Props) {
  const s = STATE_STYLE[p.inspectionState];
  return (
    <div style={{
      fontFamily: "system-ui, sans-serif", border: "1px solid #E5E7EB",
      borderRadius: 10, padding: 14, background: "#fff",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ color: "#1E3A8A", fontSize: 15 }}>{p.itemNameTh}</strong>
        <span style={{
          color: "#fff", background: s.color, borderRadius: 999,
          padding: "2px 10px", fontSize: 12,
        }}>{s.label}</span>
      </div>
      <div style={{ fontSize: 13, color: "#374151", marginTop: 6, display: "grid",
                   gridTemplateColumns: "repeat(2, 1fr)", gap: "4px 16px" }}>
        <span>รหัส: <code>{p.itemCode}</code></span>
        <span>OR: {p.orUnit}</span>
        <span>ปริมาณ: <span style={{ fontVariantNumeric: "tabular-nums" }}>{p.qtyUsed}</span></span>
        <span>ราคา: <span style={{ fontVariantNumeric: "tabular-nums" }}>{baht(p.unitPrice)}</span></span>
        <span>HN: <code>{p.hnMasked}</code></span>
        <span>AN: <code>{p.anMasked}</code></span>
      </div>
      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 8 }}>
        ยอดเรียกเก็บ: <strong style={{ fontVariantNumeric: "tabular-nums" }}>
          {baht(p.qtyUsed * p.unitPrice)}
        </strong>
        {" · "}
        {new Date(p.processedAt).toLocaleString("th-TH")}
      </div>
    </div>
  );
}
