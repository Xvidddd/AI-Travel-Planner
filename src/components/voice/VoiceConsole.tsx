"use client";

import { useState } from "react";
import { cn } from "@/components/ui/cn";
import { usePlannerStore } from "@/lib/store/planner";

interface VoiceConsoleProps {
  className?: string;
}

export function VoiceConsole({ className }: VoiceConsoleProps) {
  const [isRecording, setIsRecording] = useState(false);
  const transcript = usePlannerStore((state) => state.transcript);
  const setTranscript = usePlannerStore((state) => state.setTranscript);

  const toggleRecord = () => {
    setIsRecording((prev) => !prev);
    setTranscript(
      transcript.startsWith("试着说")
        ? "正在监听... 请描述你的行程需求"
        : "我想 5 天去东京和箱根，预算 2 万元，带孩子，想泡温泉",
    );
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
    </div>
  );
}
