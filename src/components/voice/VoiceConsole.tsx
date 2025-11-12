"use client";

import { cn } from "@/components/ui/cn";
import { usePlannerStore } from "@/lib/store/planner";
import { useVoiceInput } from "@/lib/hooks/useVoiceInput";
import { useState } from "react";

interface VoiceConsoleProps {
  className?: string;
}

export function VoiceConsole({ className }: VoiceConsoleProps) {
  const transcript = usePlannerStore((state) => state.transcript);
  const setTranscript = usePlannerStore((state) => state.setTranscript);
  const hydrateForm = usePlannerStore((state) => state.hydrateForm);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const { isRecording, error, startRecording, stopRecording } = useVoiceInput({
    onResult: (text) => {
      setTranscript(text);
    },
  });

  const toggleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleParse = async () => {
    if (!transcript.trim()) {
      setParseStatus("没有可解析的语音文本");
      return;
    }
    setIsParsing(true);
    setParseStatus("正在解析语音...");
    try {
      const res = await fetch("/api/voice/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = (await res.json()) as {
        intent?: {
          destination?: string;
          days?: number;
          budget?: number;
          personas?: string;
          preferences?: string;
        };
        error?: string;
      };
      if (!res.ok || data.error) {
        throw new Error(data.error ?? "解析失败");
      }
      if (data.intent) {
        const partial: Record<string, string | number> = {};
        if (data.intent.destination) partial.destination = data.intent.destination;
        if (typeof data.intent.days === "number") partial.days = data.intent.days;
        if (typeof data.intent.budget === "number") partial.budget = data.intent.budget;
        if (data.intent.personas) partial.personas = data.intent.personas;
        if (data.intent.preferences) partial.preferences = data.intent.preferences;
        hydrateForm(partial as any);
      }
      setParseStatus("已填入表单，可继续编辑");
    } catch (err) {
      setParseStatus((err as Error).message);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div
      className={cn(
        "pointer-events-auto w-[20rem] rounded-3xl border border-white/70 bg-white/90 p-4 shadow-2xl",
        className,
      )}
    >
      <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Voice Orbit</p>
      <p className="mt-1 text-sm text-slate-600">{transcript}</p>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      <button
        onClick={toggleRecord}
        className={cn(
          "mt-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-transparent text-sm font-semibold text-white transition",
          isRecording
            ? "bg-gradient-to-tr from-[#F97316] to-[#FB7185]"
            : "bg-gradient-to-r from-[#3B82F6] to-[#06B6D4]",
        )}
      >
        {isRecording ? "停止" : "语音"}
      </button>
      <button
        onClick={handleParse}
        disabled={isParsing}
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white/60 py-2 text-xs font-semibold text-slate-600 disabled:opacity-60"
      >
        {isParsing ? "解析中..." : "解析并填入表单"}
      </button>
      {parseStatus && <p className="mt-2 text-xs text-slate-500">{parseStatus}</p>}
    </div>
  );
}
