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
    const errorDescription = searchParams.get("error_description");
    if (errorDescription) {
      setStatus(`登录失败：${errorDescription}`);
      return;
    }
    const code = searchParams.get("code");
    if (!code) {
      setStatus("缺少 code 参数");
      return;
    }
    const exchange = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession({ code });
      if (error) {
        setStatus(`登录失败：${error.message}`);
        return;
      }
      setStatus("登录成功，正在跳转...");
      setTimeout(() => {
        router.replace("/");
      }, 1500);
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
