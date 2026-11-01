"use client";

import React, { useState, useRef, useEffect } from "react";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  model?: string;
  isFallback?: boolean;
}

const DEFAULT_SUGGESTIONS = [
  {
    icon: "🛡️",
    title: "ตรวจจับจัดซื้อแบ่งซื้อแบ่งจ้าง",
    prompt: "ตรวจสอบความเสี่ยงทุจริต การแบ่งซื้อแบ่งจ้าง (Split PO) วงเงินไม่เกิน 500,000 บาท ในรอบเดือนนี้",
  },
  {
    icon: "💰",
    title: "สรุปสภาพคล่องเงินบำรุง",
    prompt: "สรุปสถานะเงินบำรุงคงเหลือในบัญชีธนาคาร และเงินสำรองฉุกเฉินตามเกณฑ์กระทรวงสาธารณสุข",
  },
  {
    icon: "⏳",
    title: "เจ้าหนี้ค้างชำระ Aging > 60 วัน",
    prompt: "วิเคราะห์ยอดหนี้ค้างชำระเจ้าหนี้การค้า (AP Aging) และรายการที่เสี่ยงถูกระงับการจัดส่งยา",
  },
  {
    icon: "💊",
    title: "สต็อกยาใกล้หมดอายุ",
    prompt: "รายงานความเสี่ยงยาใกล้หมดอายุ (Near-Expiry) โดยเฉพาะยาควบคุมและกลุ่มยาปฏิชีวนะ",
  },
  {
    icon: "⚖️",
    title: "ตรวจสอบงบทดลอง Trial Balance",
    prompt: "ตรวจสอบความถูกต้องของสมุดรายวันทั่วไป และความสมดุลของงบทดลอง (Trial Balance) ล่าสุด",
  },
  {
    icon: "📋",
    title: "ราคามาตรฐานครุภัณฑ์",
    prompt: "ตรวจสอบบัญชีราคามาตรฐานครุภัณฑ์ สำนักงบประมาณ และเกณฑ์ราคากลางกระทรวงสาธารณสุข",
  },
  {
    icon: "🏷️",
    title: "การกำหนดรหัสครุภัณฑ์",
    prompt: "ขอข้อมูลโครงสร้างการกำหนดรหัสครุภัณฑ์ภาครัฐตามเกณฑ์กรมบัญชีกลาง และวิธีการคิดค่าเสื่อมราคา",
  },
  {
    icon: "📹",
    title: "เกณฑ์กล้องวงจรปิด CCTV",
    prompt: "ตรวจสอบเกณฑ์ราคากลางและคุณลักษณะพื้นฐานของระบบกล้องโทรทัศน์วงจรปิด (CCTV) กระทรวงดีอี",
  },
  {
    icon: "💻",
    title: "เกณฑ์คอมพิวเตอร์ MDES",
    prompt: "ขอข้อมูลเกณฑ์ราคากลางและคุณลักษณะพื้นฐานการจัดหาอุปกรณ์คอมพิวเตอร์และระบบสารสนเทศภาครัฐ",
  },
];

export default function HospitalAiCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [model, setModel] = useState("dgx-qwen3-coder:30b");
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "สวัสดีครับท่านผู้บริหาร ผมคือ **HOS-AI Executive Copilot & Watchdog** ประมวลผลผ่าน Local LLM บนซูเปอร์คอมพิวเตอร์ **MSI DGX** ภายในโรงพยาบาล ข้อมูล 100% PDPA Safe ไม่ส่งออกนอกเครือข่าย\n\nท่านสามารถสั่งการ ตรวจสอบความผิดปกติทางบัญชี-พัสดุ หรือเลือกคำสั่งด่วนด้านล่างได้ทันทีครับ",
      timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      model: "MSI DGX GPU",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  // Global custom event listener for triggering Copilot from anywhere
  useEffect(() => {
    const handleOpenEvent = (event: any) => {
      setIsOpen(true);
      if (event.detail?.model) {
        setModel(event.detail.model);
      }
      if (event.detail?.prompt) {
        handleSend(event.detail.prompt);
      }
    };

    window.addEventListener("open-hos-ai-copilot", handleOpenEvent);
    return () => window.removeEventListener("open-hos-ai-copilot", handleOpenEvent);
  }, []);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputMessage("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-6)
        .map((m) => ({
          role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: m.text,
        }));

      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: textToSend,
          model,
          history,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.answer || "ไม่สามารถประมวลผลคำตอบได้ กรุณาลองใหม่อีกครั้ง",
        timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        model: data.model,
        isFallback: data.fallback,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: `⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ Local DGX Model (${err.message}) กรุณาตรวจสอบสถานะ Ollama บน MSI DGX`,
        timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        isFallback: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        sender: "ai",
        text: "รีเซ็ตการสนทนาเรียบร้อย พร้อมรับคำสั่งวิเคราะห์ระบบงานโรงพยาบาลครับ",
        timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        model: "MSI DGX GPU",
      },
    ]);
  };

  // Helper formatting for bold and linebreaks
  const renderFormattedText = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, lIdx) => {
      // Bold syntax **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={lIdx} className="min-h-[1.25rem]">
          {parts.map((p, pIdx) => {
            if (p.startsWith("**") && p.endsWith("**")) {
              return (
                <strong key={pIdx} className="text-white font-semibold">
                  {p.slice(2, -2)}
                </strong>
              );
            }
            return <span key={pIdx}>{p}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-900/40 hover:shadow-indigo-600/50 hover:scale-105 active:scale-95 transition-all duration-200 border border-indigo-400/30 group"
          title="เปิด HOS-AI Executive Copilot & Watchdog"
        >
          <div className="relative">
            <span className="text-xl">🤖</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold tracking-wide flex items-center gap-1">
              HOS-AI Copilot
              <span className="bg-purple-500/30 border border-purple-400/50 text-[9px] px-1.5 py-0.2 rounded text-purple-200">
                DGX
              </span>
            </span>
            <span className="text-[10px] text-indigo-200 font-mono">Local LLM • PDPA 100%</span>
          </div>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[500px] h-[640px] max-h-[85vh] rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 shadow-2xl flex flex-col overflow-hidden text-slate-100 transition-all duration-300 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-b border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-lg shadow-inner">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white tracking-wide">
                    HOS-AI Executive Copilot & Watchdog
                  </h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1"></span>
                    DGX Live
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  100% On-Premises Air-Gapped AI • Local GPU Inference
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition"
                title="ล้างการสนทนา"
              >
                🔄
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white text-base transition font-bold"
                title="ย่อหน้าต่าง"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Model Selector Bar */}
          <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[11px]">🧠 โมเดลประมวลผล:</span>
            </div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-slate-900 border border-indigo-500/30 text-indigo-200 text-xs rounded-md px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="dgx-qwen3-coder:30b">Qwen-3 30B (แนะนำ: วิเคราะห์ไว ฉลาดรอบด้าน)</option>
              <option value="dgx-deepseek-r1:32b">DeepSeek-R1 32B (Deep Reasoning: ตรวจโกง)</option>
              <option value="haiku:latest">Haiku Fast (ตอบสนองด่วนทันใจ)</option>
              <option value="gemma3:27b">Gemma-3 27B (สรุปและสถิติภาพรวม)</option>
            </select>
          </div>

          {/* Quick Suggestions (if few messages) */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 bg-indigo-950/20 border-b border-indigo-900/30">
              <div className="text-[10px] text-indigo-300 font-semibold mb-1.5 flex items-center gap-1">
                <span>⚡ ตัวอย่างคำสั่งด่วนสำหรับผู้บริหาร:</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {DEFAULT_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="flex-shrink-0 text-[11px] bg-slate-800/80 hover:bg-indigo-900/60 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-white px-2.5 py-1 rounded-full transition flex items-center gap-1"
                  >
                    <span>{item.icon}</span>
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Window */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1 px-1">
                  <span>{msg.sender === "user" ? "ท่านผู้บริหาร" : "HOS-AI"}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                  {msg.model && (
                    <span className="bg-indigo-900/50 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30 text-[9px] font-mono">
                      {msg.model}
                    </span>
                  )}
                  {msg.isFallback && (
                    <span className="bg-amber-950 text-amber-300 px-1 rounded text-[9px]">
                      Expert Rule
                    </span>
                  )}
                </div>

                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none"
                  }`}
                >
                  {renderFormattedText(msg.text)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1 text-[10px] text-indigo-400 mb-1 px-1">
                  <span>HOS-AI กำลังคิดและประมวลผลผ่าน GPU บน DGX...</span>
                </div>
                <div className="bg-slate-800/80 border border-indigo-500/30 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-indigo-300">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></div>
                  <span className="text-[11px] font-mono ml-1">DGX Local Engine Running...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="p-3 bg-slate-950 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="สอบถามข้อมูล ร้องขอการวิเคราะห์ หรือตรวจสอบทุจริต..."
                disabled={loading}
                className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 text-white placeholder-slate-500 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1 disabled:text-slate-500 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>ส่ง</span>
                <span>➤</span>
              </button>
            </form>
            <div className="mt-1.5 flex justify-between items-center text-[10px] text-slate-500 px-1">
              <span>🔒 100% Local GPU Inference (MSI DGX)</span>
              <span>พ.ร.บ. จัดซื้อจัดจ้างฯ 2560 & PDPA</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
