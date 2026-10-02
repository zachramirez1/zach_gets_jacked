"use client";
import { useState, useEffect } from "react";
import Shell from "@/components/Shell";
import Card from "@/components/Card";
import { getApiKey, setApiKey, getTrackedLifts, setTrackedLifts } from "@/lib/store";

export default function SettingsPage() {
  const [key, setKey] = useState("");
  const [lifts, setLiftsState] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setKey(getApiKey());
    setLiftsState(getTrackedLifts());
  }, []);

  if (!mounted) return null;

  function saveAll() {
    setApiKey(key);
    setTrackedLifts(lifts);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function updateLift(i: number, val: string) {
    const updated = [...lifts];
    updated[i] = val;
    setLiftsState(updated);
  }

  return (
    <Shell title="Settings">
      {/* API Key */}
      <Card className="mb-4">
        <div className="text-xs text-[#737373] mb-3 font-semibold uppercase tracking-widest">Hevy API Key</div>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Paste your Hevy API key"
          autoComplete="off"
          className="w-full rounded-lg bg-[#0a0a0a] border border-[#262626] px-3 py-2 text-sm text-[#f5f5f5]"
        />
        <p className="text-xs text-[#737373] mt-3">
          Get your key at hevy.com/settings → Developer (requires Hevy Pro).
        </p>
      </Card>

      {/* Tracked Lifts */}
      <Card className="mb-6">
        <div className="text-xs text-[#737373] mb-1 font-semibold uppercase tracking-widest">Tracked Lifts (1RM)</div>
        <p className="text-xs text-[#737373] mb-3">Enter the exact exercise names as they appear in Hevy.</p>
        {lifts.map((l, i) => (
          <input
            key={i}
            type="text"
            value={l}
            onChange={(e) => updateLift(i, e.target.value)}
            placeholder={`Lift ${i + 1}`}
            className="w-full rounded-lg bg-[#0a0a0a] border border-[#262626] px-3 py-2 text-sm text-[#f5f5f5] mb-2"
          />
        ))}
      </Card>

      <button
        onClick={saveAll}
        className="w-full rounded-xl bg-orange-500 py-4 font-bold text-white text-base active:opacity-80"
      >
        {saved ? "Saved ✓" : "Save Settings"}
      </button>
    </Shell>
  );
}
