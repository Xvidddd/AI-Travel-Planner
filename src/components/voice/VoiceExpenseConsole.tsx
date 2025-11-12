"use client";

import { useState } from "react";
import { cn } from "@/components/ui/cn";
import { useVoiceInput } from "@/lib/hooks/useVoiceInput";
import type { ExpenseCategory } from "@/types/expense";

interface VoiceExpenseConsoleProps {
  onParsed: (intent: { category?: ExpenseCategory; amount?: number; note?: string }) => void;
}

export function VoiceExpenseConsole({ onParsed }: VoiceExpenseConsoleProps) {
  const [transcript, setTranscript] = useState("按下开始语音");
  const [status, setStatus] = useState<string | null>(null);
  const { isRecording, error, startRecording, stopRecording } = useVoiceInput({
    onResult: (text) => setTranscript(text),
  });

  const handleParse = async () => {
    if (!transcript.trim()) {
      setStatus("没有可解析的语音内容");
      return;
    }
    setStatus("解析语音记账中...");
    try {
      const res = await fetch("/api/voice/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = (await res.json()) as {
        intent?: { category?: ExpenseCategory; amount?: number; note?: string };
        error?: string;
      };
      if (!res.ok || data.error || !data.intent) {
        throw new Error(data.error ?? "解析失败");
      }
      onParsed(data.intent);
      setStatus("语音已填入表单，可继续编辑");
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Voice Expense</p>
          <p className="text-sm font-semibold text-slate-700">语音记账</p>
        </div>
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={cn(
            "rounded-full border px-3 py-1 text-xs",
            isRecording ? "border-red-200 text-red-500" : "border-slate-200 text-slate-600",
          )}
        >
          {isRecording ? "停止" : "开始录音"}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">{transcript}</p>
      <button
        type="button"
        onClick={handleParse}
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white/60 py-2 text-xs text-slate-600"
      >
        解析语音填入表单
      </button>
      {status && <p className="mt-2 text-xs text-slate-500">{status}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
