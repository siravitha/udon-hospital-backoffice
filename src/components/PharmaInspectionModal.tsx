"use client";
// PharmaInspectionModal — receiving inspection form for pharmacy/clinical
// Captures Lot/Expiry/Cold-Chain/COA + inspection_days (penalty deduction)
import { useState } from "react";

export interface InspectionDraft {
  result: "PASS" | "FAIL" | "OBJECTION";
  lotNo: string;
  expiryDate: string;
  coldChainOk: boolean;
  coaAttached: boolean;
  fdaNo: string;
  inspectionDays: number; // days committee used → deducted from penalty
  objectionNote?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (d: InspectionDraft) => void;
}

export function PharmaInspectionModal({ open, onClose, onSubmit }: Props) {
  const [result, setResult] = useState<InspectionDraft["result"]>("PASS");
  const [lotNo, setLotNo] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [coldChainOk, setColdChainOk] = useState(true);
  const [coaAttached, setCoaAttached] = useState(false);
  const [fdaNo, setFdaNo] = useState("");
  const [inspectionDays, setInspectionDays] = useState(0);
  const [objectionNote, setObjectionNote] = useState("");

  if (!open) return null;

  function submit() {
    onSubmit({ result, lotNo, expiryDate, coldChainOk, coaAttached, fdaNo, inspectionDays,
                objectionNote: objectionNote || undefined });
    onClose();
  }

  const label: React.CSSProperties = {
    display: "block", fontSize: 12, color: "#374151", marginBottom: 2, marginTop: 10,
  };
  const input: React.CSSProperties = {
    width: "100%", border: "1px solid #D1D5DB", borderRadius: 6, padding: "6px 8px",
    fontSize: 14, boxSizing: "border-box",
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="ฟอร์มตรวจรับยา" style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,.5)",
      display: "grid", placeItems: "center", zIndex: 50,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 12, padding: 24,
        width: 460, fontFamily: "system-ui, sans-serif",
      }}>
        <h3 style={{ margin: 0, color: "#1E3A8A" }}>ตรวจรับยา / วัสดุ — {result}</h3>

        <label style={label}>ผลการตรวจรับ</label>
        <select style={input} value={result}
                onChange={(e) => setResult(e.target.value as InspectionDraft["result"])}>
          <option value="PASS">PASS — ผ่าน</option>
          <option value="FAIL">FAIL — ไม่ผ่าน</option>
          <option value="OBJECTION">OBJECTION — กรรมการทักท้วง</option>
        </select>

        <label style={label}>Lot No.</label>
        <input style={input} value={lotNo} onChange={(e) => setLotNo(e.target.value)} />

        <label style={label}>วันหมดอายุ (Expiry)</label>
        <input style={input} type="date" value={expiryDate}
               onChange={(e) => setExpiryDate(e.target.value)} />

        <label style={label}>Cold Chain OK?</label>
        <select style={input} value={coldChainOk ? "1" : "0"}
                onChange={(e) => setColdChainOk(e.target.value === "1")}>
          <option value="1">ผ่าน</option>
          <option value="0">ไม่ผ่าน</option>
        </select>

        <label style={label}>ใบ COA แนบแล้ว?</label>
        <select style={input} value={coaAttached ? "1" : "0"}
                onChange={(e) => setCoaAttached(e.target.value === "1")}>
          <option value="1">แนบแล้ว</option>
          <option value="0">ยังไม่นับ</option>
        </select>

        <label style={label}>เลข อย. (FDA)</label>
        <input style={input} value={fdaNo} onChange={(e) => setFdaNo(e.target.value)} />

        <label style={label}>จำนวนวันที่คณะกรรมการใช้ตรวจรับ (หยุดนับวันปรับ)</label>
        <input style={input} type="number" min={0} max={30} value={inspectionDays}
               onChange={(e) => setInspectionDays(Number(e.target.value))} />

        {result === "OBJECTION" && (
          <>
            <label style={label}>เหตุผลทักท้วง</label>
            <textarea style={{ ...input, minHeight: 60 }} value={objectionNote}
                      onChange={(e) => setObjectionNote(e.target.value)} />
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={submit} style={{
            flex: 1, background: result === "PASS" ? "#059669" : "#DC2626",
            color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 0", fontSize: 15, cursor: "pointer",
          }}>ยืนยันผลการตรวจรับ</button>
          <button onClick={onClose} style={{
            background: "#F3F4F6", color: "#374151", border: "1px solid #D1D5DB",
            borderRadius: 8, padding: "10px 18px", fontSize: 14, cursor: "pointer",
          }}>ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}
