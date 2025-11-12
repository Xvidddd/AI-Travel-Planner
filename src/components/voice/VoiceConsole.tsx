"use client";

import { cn } from "@/components/ui/cn";
import { usePlannerStore } from "@/lib/store/planner";
import { useVoiceInput } from "@/lib/hooks/useVoiceInput";

interface VoiceConsoleProps {
  className?: string;
}

export function VoiceConsole({ className }: VoiceConsoleProps) {
  const transcript = usePlannerStore((state) => state.transcript);
  const setTranscript = usePlannerStore((state) => state.setTranscript);
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
    </div>
  );
}
