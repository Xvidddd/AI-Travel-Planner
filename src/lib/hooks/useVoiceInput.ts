"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface RecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onaudioend?: () => void;
  onend?: () => void;
  onresult?: (event: RecognitionEvent) => void;
  onerror?: (event: { error?: string }) => void;
}

type RecognitionConstructor = new () => RecognitionInstance;

type RecognitionEvent = {
  results: ArrayLike<{ [index: number]: { transcript: string } }>;
};

interface UseVoiceInputOptions {
  locale?: string;
  onResult?: (text: string) => void;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const { locale = "zh-CN", onResult } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("按下开始语音");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionInstance | null>(null);
  const recordingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const RecognitionConstructor =
      (window as Window & {
        webkitSpeechRecognition?: RecognitionConstructor;
        SpeechRecognition?: RecognitionConstructor;
      }).webkitSpeechRecognition || window.SpeechRecognition;

    if (!RecognitionConstructor) {
      setError("当前浏览器不支持 Web Speech API，可在设置中切换至讯飞语音模式");
      return;
    }

    const recognition = new RecognitionConstructor() as RecognitionInstance;
    recognition.lang = locale;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event: RecognitionEvent) => {
      const latest = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ");
      setTranscript(latest);
      onResult?.(latest);
    };
    recognition.onerror = (evt: { error?: string }) => {
      setError(evt.error ?? "语音识别失败");
      recordingRef.current = false;
      setIsRecording(false);
    };
    const resume = () => {
      if (!recordingRef.current) {
        setIsRecording(false);
        return;
      }
      setTimeout(() => {
        if (!recordingRef.current) return;
        try {
          recognition.start();
        } catch (err) {
          console.error("Speech restart failed", err);
          recordingRef.current = false;
          setIsRecording(false);
        }
      }, 400);
    };
    recognition.onaudioend = resume;
    recognition.onend = resume;

    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [locale, onResult]);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      setError("未检测到语音识别模块");
      return;
    }
    try {
      setError(null);
      setTranscript("正在聆听，请描述你的旅行需求...");
      try {
        recognitionRef.current.abort?.();
      } catch (err) {
        console.warn("Speech abort failed", err);
      }
      recognitionRef.current.start();
      setIsRecording(true);
      recordingRef.current = true;
    } catch (err) {
      setError((err as Error).message);
      setIsRecording(false);
      recordingRef.current = false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }
    recognitionRef.current.stop();
    setIsRecording(false);
    recordingRef.current = false;
  }, []);

  return {
    isRecording,
    transcript,
    error,
    startRecording,
    stopRecording,
  };
}
