"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/providers/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [status, setStatus] = useState("正在处理登录...");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const errorDescription = searchParams.get("error_description");
    if (errorDescription) {
      setStatus(`登录失败：${errorDescription}`);
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    if (accessToken && refreshToken) {
      const setHashSession = async () => {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          window.history.replaceState({}, document.title, "/");
          setStatus("登录成功，正在跳转...");
          setTimeout(() => router.replace("/"), 1200);
        } catch (err) {
          setStatus(`登录失败：${(err as Error).message}`);
        }
      };
      setHashSession();
      return;
    }

    const code = searchParams.get("code");
    const verifier = searchParams.get("code_verifier");
    if (!code || !verifier) {
      setStatus("登录完成，正在跳转...");
      setTimeout(() => router.replace("/"), 1000);
      return;
    }

    const exchange = async () => {
      try {
        const { error } = await (supabase.auth as any).exchangeCodeForSession({
          authCode: code,
          codeVerifier: verifier,
        });
        if (error) {
          throw error;
        }
        setStatus("登录成功，正在跳转...");
        setTimeout(() => router.replace("/"), 1200);
      } catch (err) {
        setStatus(`登录失败：${(err as Error).message}`);
      }
    };
    exchange();
  }, [router, searchParams, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#F8FBFF] to-[#D6EEFF]">
      <div className="rounded-3xl bg-white/90 px-8 py-10 text-center shadow-2xl">
        <p className="text-sm text-slate-500">{status}</p>
      </div>
    </div>
  );
}
