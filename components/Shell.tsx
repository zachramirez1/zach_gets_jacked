"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Today", icon: "🎯" },
  { href: "/progress", label: "Progress", icon: "📈" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

// Pages read localStorage, so their content only renders on the client
const noop = () => () => {};
function useIsClient() {
  return useSyncExternalStore(noop, () => true, () => false);
}

export default function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const isClient = useIsClient();
  const path = usePathname();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-bg px-4 py-4">
        <h1 className="text-xl font-bold tracking-tight text-orange-500">{title}</h1>
      </header>
      <main className="flex-1 px-4 py-4 pb-24">{isClient && children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-line bg-bg">
        {TABS.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs ${active ? "text-orange-500" : "text-muted"}`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
