import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "SafeCode Docs — AI Security Swarm",
  description: "Architecture, API reference, and setup guides for the SafeCode AI Security Swarm.",
};

const navLinks = [
  { name: "Overview", href: "/" },
  { name: "Architecture", href: "/architecture" },
  { name: "API Reference", href: "/api" },
  { name: "Configuration", href: "/configuration" },
  { name: "Deployment", href: "/deployment" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.className} ${mono.variable} min-h-screen`}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-[240px] h-screen sticky top-0 border-r border-white/[0.06] bg-[#0b0b11] flex flex-col shrink-0">
            <div className="px-5 py-6">
              <Link href="/" className="flex items-center gap-2 no-underline">
                <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white text-xs font-bold">S</div>
                <span className="text-sm font-bold text-white tracking-tight">SafeCode Docs</span>
              </Link>
            </div>
            <div className="mx-5 h-px bg-white/[0.06]" />
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 rounded-lg text-[13px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-all no-underline"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            <div className="px-5 py-4 border-t border-white/[0.06]">
              <a
                href="http://localhost:3000"
                className="text-[11px] text-zinc-600 hover:text-zinc-400 no-underline"
              >
                ← Back to Dashboard
              </a>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[800px] mx-auto px-8 py-12">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
