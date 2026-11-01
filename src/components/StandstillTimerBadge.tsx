"use client";
// StandstillTimerBadge — 7-working-day standstill countdown (holiday-aware)
// While open: amber badge + "PO blocked (423)" · after due: green "Closed"
import { useEffect, useState } from "react";

interface Props {
  dueDate: string | null;   // ISO timestamp
  open: boolean;
  workingDaysElapsed?: number; // optional, from server
}

const STANDSTILL_WORKING_DAYS = 7;

export function StandstillTimerBadge({ dueDate, open, workingDaysElapsed }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const closed = !open || (dueDate !== null && new Date(dueDate).getTime() <= now);

  if (closed) {
    return (
      <span style={{
        fontFamily: "system-ui, sans-serif", display: "inline-flex",
        alignItems: "center", gap: 6, color: "#fff", background: "#059669",
        borderRadius: 999, padding: "4px 12px", fontSize: 13,
      }}>
        ✓ Standstill ปิดแล้ว — เรียก Call-Off ได้
      </span>
    );
  }

  const msLeft = dueDate ? Math.max(0, new Date(dueDate).getTime() - now) : 0;
  const days = Math.floor(msLeft / 86_400_000);
  const hours = Math.floor((msLeft % 86_400_000) / 3_600_000);

  return (
    <span style={{
      fontFamily: "system-ui, sans-serif", display: "inline-flex",
      alignItems: "center", gap: 8, color: "#fff", background: "#D97706",
      borderRadius: 999, padding: "4px 12px", fontSize: 13,
    }}>
      ⏳ Standstill: เหลือ {days}d {hours}h
      <span style={{
        background: "rgba(0,0,0,.25)", borderRadius: 999,
        padding: "1px 8px", fontSize: 11,
      }}>
        {workingDaysElapsed ?? 0}/{STANDSTILL_WORKING_DAYS} วันทำการ · PO blocked (423)
      </span>
    </span>
  );
}
