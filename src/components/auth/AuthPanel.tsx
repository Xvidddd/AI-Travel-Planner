"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/components/ui/cn";

type AuthMode = "signin" | "signup" | "magic";

interface AuthPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AuthPanel({ open, onClose }: AuthPanelProps) {
  const { user, supabase, loading, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("signin");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleAuthSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email) {
      setStatus("请输入邮箱");
      return;
    }
    if (mode !== "magic" && password.length < 6) {
      setStatus("密码至少 6 位");
      return;
    }
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!projectUrl || !anonKey) {
      setStatus("缺少 Supabase URL 或 Anon Key，无法登录");
      return;
    }

    setSubmitting(true);
    setStatus(mode === "magic" ? "发送邮箱链接中..." : "正在处理...");
    try {
      if (mode === "magic") {
        const redirectTo = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${redirectTo}/auth/callback`,
          },
        });
        if (error) throw error;
        setStatus("登录链接已发送，请检查邮箱");
        return;
      }

      if (mode === "signup") {
        const redirectTo = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${redirectTo}/auth/callback`,
          },
        });
        if (error) throw error;
        setStatus("注册成功，请查收验证邮件");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setStatus("登录成功");
        onClose();
      }
    } catch (error) {
      if (error instanceof TypeError) {
        setStatus("无法连接 Supabase，请检查网络或 Supabase URL 是否可访问");
      } else {
        setStatus((error as Error).message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setSubmitting(true);
    try {
      await signOut();
      setStatus("已退出");
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

const modeTabs: Array<{ key: AuthMode; label: string }> = [
  { key: "signin", label: "登录" },
  { key: "signup", label: "注册" },
  { key: "magic", label: "邮箱链接登录" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Account</p>
            <h3 className="text-xl font-semibold text-slate-800">Supabase 登录</h3>
          </div>
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">
            关闭
          </button>
        </div>
        {user ? (
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>当前账号：{user.email ?? "未知邮箱"}</p>
            <button
              onClick={handleSignOut}
              disabled={submitting}
              className={cn(
                "w-full rounded-full bg-slate-900/90 py-2 text-white",
                submitting && "opacity-60",
              )}
            >
              退出登录
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
            <div className="flex gap-2 text-xs">
              {modeTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setMode(tab.key);
                    setStatus(null);
                  }}
                  className={cn(
                    "flex-1 rounded-full border px-3 py-1",
                    mode === tab.key
                      ? "border-slate-900/80 bg-slate-900/80 text-white"
                      : "border-slate-200 text-slate-500",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <label className="text-sm text-slate-600">
              邮箱
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-slate-700 focus:border-aurora-blue focus:outline-none"
                placeholder="you@example.com"
              />
            </label>
            {mode !== "magic" && (
              <label className="text-sm text-slate-600">
                密码
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-slate-700 focus:border-aurora-blue focus:outline-none"
                  placeholder="至少 6 位"
                  minLength={6}
                />
              </label>
            )}
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "w-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] py-2 text-sm font-semibold text-white",
                submitting && "opacity-60",
              )}
            >
              {submitting
                ? "处理中..."
                : mode === "signup"
                ? "注册"
                : mode === "magic"
                ? "发送邮箱链接"
                : "登录"}
            </button>
          </form>
        )}
        {status && <p className="mt-3 text-xs text-slate-500">{status}</p>}
        {loading && <p className="mt-2 text-xs text-slate-400">正在同步会话...</p>}
      </div>
    </div>
  );
}
