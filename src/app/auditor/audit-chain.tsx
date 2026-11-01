"use client";

import React, { useEffect, useState, useCallback } from "react";

export function AuditChainVerifier() {
  const [logs, setLogs] = useState<any[]>([]);
  const [verification, setVerification] = useState<{
    valid: boolean;
    checkedCount: number;
    brokenAtSeq: number | null;
    merkleRoot: string;
  } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchChain = useCallback(async () => {
    setVerifying(true);
    try {
      const res = await fetch("/api/audit/chain");
      const data = await res.json();
      if (data.ok) {
        setLogs(data.logs || []);
        setVerification(data.verification);
      }
    } finally {
      setVerifying(false);
    }
  }, []);

  useEffect(() => {
    fetchChain();
  }, [fetchChain]);

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1E3A8A]">
            🔐 Partitioned SHA-256 Cryptographic Audit Hash Chain (`system_audit_logs`)
          </h2>
          <p className="text-xs text-slate-600">
            Append-Only WORM Forensics Log สำหรับผู้ตรวจสอบภายนอก (สตง. / ป.ป.ช.) พร้อมตรวจสอบความเชื่อมโยง `prev_hash` → `row_hash`
          </p>
        </div>
        <button
          onClick={fetchChain}
          disabled={verifying}
          className="px-4 py-2.5 rounded-lg bg-[#059669] hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
        >
          {verifying
            ? "⏳ กำลังคำนวณ SHA-256..."
            : "🔍 ตรวจสอบความสมบูรณ์ของสายโซ่ Hash Chain (Verify SHA-256 Chain Integrity)"}
        </button>
      </div>

      {verification && (
        <div
          className={`p-4 rounded-xl border text-xs space-y-1 ${
            verification.valid
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-rose-50 border-rose-300 text-rose-950"
          }`}
        >
          <div className="font-bold text-sm">
            {verification.valid
              ? `✅ ผลการตรวจสอบ SHA-256 Hash Chain: สมบูรณ์ 100% (ตรวจสอบแล้ว ${verification.checkedCount} รายการ ไม่พบการแก้ไขย้อนหลัง)`
              : `🚨 ตรวจพบความผิดปกติของสายโซ่ที่ลำดับ #${verification.brokenAtSeq}`}
          </div>
          <div className="font-mono break-all">
            <span className="font-semibold">Daily Merkle Tree Root (SHA-256):</span> {verification.merkleRoot}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-700 uppercase">
              <th className="p-2.5">Seq</th>
              <th className="p-2.5">เวลา (ISO-8601)</th>
              <th className="p-2.5">ผู้ทำรายการ</th>
              <th className="p-2.5">Action / Entity</th>
              <th className="p-2.5">รายละเอียด (PDPA Masked)</th>
              <th className="p-2.5">prev_hash → row_hash (SHA-256)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {logs.map((log) => (
              <tr key={log.logId} className="hover:bg-slate-50">
                <td className="p-2.5 font-mono font-bold text-[#1E3A8A]">#{log.seq}</td>
                <td className="p-2.5 font-mono text-slate-600">{log.eventTime}</td>
                <td className="p-2.5 font-semibold">{log.actorUsername}</td>
                <td className="p-2.5">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-[#1E3A8A] font-mono font-semibold">
                    {log.actionType}
                  </span>
                </td>
                <td className="p-2.5 text-slate-700">{log.payloadSummary}</td>
                <td className="p-2.5 font-mono text-[11px] text-slate-500">
                  <div>prev: {String(log.prevHash).slice(0, 14)}…</div>
                  <div className="text-emerald-700 font-semibold">curr: {String(log.rowHash).slice(0, 14)}…</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export const AuditChainDemo = AuditChainVerifier;
export default AuditChainVerifier;
