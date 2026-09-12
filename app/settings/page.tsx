"use client";
import { useState, useEffect } from "react";
import Shell from "@/components/Shell";
import Card from "@/components/Card";
import {
  getApiKey, setApiKey,
  getUnits, setUnits,
  getTrackedLifts, setTrackedLifts,
  type Units,
} from "@/lib/store";
import { getWorkouts } from "@/lib/hevy";

export default function SettingsPage() {
  const [key, setKey] = useState("");
  const [units, setUnitsState] = useState<Units>("lbs");
  const [lifts, setLiftsState] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setKey(getApiKey());
    setUnitsState(getUnits());
    setLiftsState(getTrackedLifts());
  }, []);

  if (!mounted) return null;

  async function testKey() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await getWorkouts(key.trim(), 1, 1);
      setTestResult({ ok: true, msg: `Connected! Found ${res.page_count > 0 ? "workouts" : "0 workouts"} in your account.` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setTestResult({ ok: false, msg });
    } finally {
      setTesting(false);
    }
  }

  function saveAll() {
    setApiKey(key);
    setUnits(units);
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
          className="w-full rounded-lg bg-[#0a0a0a] border border-[#262626] px-3 py-2 text-sm text-[#f5f5f5] mb-3"
        />
        <div className="flex gap-2 items-center">
          <button
            onClick={testKey}
            disabled={!key || testing}
            className="rounded-lg bg-[#262626] px-4 py-2 text-sm font-semibold text-[#f5f5f5] disabled:opacity-40"
          >
            {testing ? "Testing..." : "Test Connection"}
          </button>
          {testResult && (
            <span className={`text-xs ${testResult.ok ? "text-green-400" : "text-red-400"}`}>
              {testResult.msg}
            </span>
          )}
        </div>
        <p className="text-xs text-[#737373] mt-3">
          Get your key at hevy.com/settings → Developer (requires Hevy Pro).
        </p>
      </Card>

      {/* Units */}
      <Card className="mb-4">
        <div className="text-xs text-[#737373] mb-3 font-semibold uppercase tracking-widest">Units</div>
        <div className="flex gap-3">
          {(["lbs", "kg"] as Units[]).map((u) => (
            <button
              key={u}
              onClick={() => setUnitsState(u)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                units === u
                  ? "bg-orange-500 text-white"
                  : "bg-[#0a0a0a] border border-[#262626] text-[#737373]"
              }`}
            >
              {u.toUpperCase()}
            </button>
          ))}
        </div>
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
