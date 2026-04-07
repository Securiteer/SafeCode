import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const outfit = Outfit({ subsets: ["latin"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "SafeCode — AI Security Swarm",
  description: "Autonomous multi-agent AI system for continuous repository security scanning and remediation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.className} ${mono.variable} min-h-screen text-zinc-100`}>
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="relative z-10 flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-h-screen overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
