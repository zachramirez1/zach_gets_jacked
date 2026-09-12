"use client";
import Nav from "./Nav";

export default function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-[#262626] px-4 py-4">
        <h1 className="text-xl font-bold text-orange-500 tracking-tight">{title}</h1>
      </header>
      <main className="flex-1 overflow-auto px-4 py-4 pb-24">{children}</main>
      <Nav />
    </div>
  );
}
