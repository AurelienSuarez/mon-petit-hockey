"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", match: ["/dashboard", "/leagues"], icon: "🏆", label: "Ligues" },
  { href: "/matches", match: ["/matches"], icon: "🏑", label: "Matchs" },
  { href: "/profile", match: ["/profile"], icon: "👤", label: "Profil" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        const active = tab.match.some((p) => pathname === p || pathname.startsWith(`${p}/`));
        return (
          <Link key={tab.href} href={tab.href} className={`bottom-nav-tab${active ? " active" : ""}`}>
            <span className="bottom-nav-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
