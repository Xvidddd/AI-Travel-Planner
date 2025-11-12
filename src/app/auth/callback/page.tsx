import { Suspense } from "react";
import { AuthCallbackContent } from "./AuthCallbackContent";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#F8FBFF] to-[#D6EEFF]">
          <div className="rounded-3xl bg-white/90 px-8 py-10 text-center shadow-2xl">
            <p className="text-sm text-slate-500">正在处理登录...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
