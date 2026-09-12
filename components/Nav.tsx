"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", icon: "⚡" },
  { href: "/weight", label: "Weight", icon: "⚖️" },
  { href: "/lifts", label: "1RM", icon: "🏋️" },
  { href: "/program", label: "5/3/1", icon: "🎯" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#262626] bg-[#0a0a0a]">
      <div className="flex">
        {links.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
                active ? "text-orange-500" : "text-[#737373]"
              }`}
            >
              <span className="text-lg leading-none">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
