import type { Metadata } from "next";
import "../styles/globals.css";
import { AuroraLayout } from "@/components/layout/AuroraLayout";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  title: "AuroraVoyage · AI 旅行规划师",
  description:
    "AuroraVoyage 提供语音驱动的 AI 行程规划、预算记账与地图联动体验。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hans">
      <body>
        <AuthProvider>
          <AuroraLayout>{children}</AuroraLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
