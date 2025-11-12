"use client";

import { PropsWithChildren, useState } from "react";
import Link from "next/link";
import { VoiceConsole } from "@/components/voice/VoiceConsole";
import { cn } from "@/components/ui/cn";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthPanel } from "@/components/auth/AuthPanel";

export function AuroraLayout({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FBFF] to-[#D6EEFF] text-slate-900">
      <header className="backdrop-blur-xl bg-white/60 sticky top-0 z-40 border-b border-white/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-semibold tracking-wide text-slate-700">
            AuroraVoyage
          </Link>
          <nav className="flex items-center gap-6 text-sm text-slate-600">
            <Link href="/docs">文档</Link>
            <Link href="/status">系统状态</Link>
            <button
              onClick={() => setAuthOpen(true)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-400"
            >
              {user ? user.email ?? "账户" : "登录 / 注册"}
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 lg:px-6">
        {children}
      </main>
      <VoiceConsole className="fixed bottom-6 right-6" />
      <footer className="mx-auto mt-16 max-w-6xl px-6 pb-10 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} AuroraVoyage
      </footer>
      <AuthPanel open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
