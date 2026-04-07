"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard, FolderGit2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Repositories", href: "/repositories", icon: FolderGit2 },
  { name: "Settings", href: "/admin", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] h-screen sticky top-0 flex flex-col border-r border-white/[0.06] bg-[#0b0b11]/80 backdrop-blur-xl shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-bold tracking-tight text-white">SafeCode</span>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-white/[0.06]" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navigation.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive && "text-violet-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <span className="text-[11px] text-zinc-600 font-medium">System Online</span>
        </div>
      </div>
    </aside>
  );
}
