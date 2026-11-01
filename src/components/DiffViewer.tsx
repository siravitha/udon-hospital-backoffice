// DiffViewer — Side-by-side contract draft diff for Legal Desk
// Red = removed, green = added; line-based for the minimal viable version
interface Props {
  original: string;
  revised: string;
  title?: string;
}

type LineKind = "same" | "added" | "removed";

function diffLines(original: string, revised: string): { left: LineKind[]; right: LineKind[] } {
  const a = original.split("\n");
  const b = revised.split("\n");
  // Minimal LCS-free alignment: pairwise scan; sufficient for draft review UI.
  const left: LineKind[] = a.map(() => "same");
  const right: LineKind[] = b.map(() => "same");
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i++) {
    const av = a[i];
    const bv = b[i];
    if (av === undefined) { left.push("removed"); }
    if (bv === undefined) { right.push("added"); }
    if (av !== undefined && bv !== undefined && av !== bv) {
      left[i] = "removed";
      right[i] = "added";
    }
  }
  return { left, right };
}

const COLOR: Record<LineKind, string> = {
  same: "#fff",
  added: "#DCFCE7",
  removed: "#FEE2E2",
};

export function DiffViewer({ original, revised, title = "ตรวจร่างสัญญา (Side-by-side)" }: Props) {
  const { left, right } = diffLines(original, revised);
  const cell: React.CSSProperties = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 12, padding: "2px 8px", whiteSpace: "pre-wrap",
    verticalAlign: "top",
  };
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", border: "1px solid #E5E7EB",
                  borderRadius: 10, overflow: "hidden" }}>
      <div style={{
        background: "#1E3A8A", color: "#fff", padding: "8px 14px", fontSize: 14,
      }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ borderRight: "1px solid #E5E7EB" }}>
          <div style={{ padding: "4px 8px", fontSize: 11, color: "#6B7280",
                        background: "#F9FAFB", fontWeight: 600 }}>ต้นฉบับ</div>
          {left.map((k, i) => (
            <div key={`l${i}`} style={{ ...cell, background: COLOR[k] }}>
              {original.split("\n")[i] ?? ""}
            </div>
          ))}
        </div>
        <div>
          <div style={{ padding: "4px 8px", fontSize: 11, color: "#6B7280",
                        background: "#F9FAFB", fontWeight: 600 }}>ร่างแก้ไข</div>
          {right.map((k, i) => (
            <div key={`r${i}`} style={{ ...cell, background: COLOR[k] }}>
              {revised.split("\n")[i] ?? ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
