"use client";
import { useState } from "react";
import Shell from "@/components/Shell";
import Card, { Label } from "@/components/Card";
import { getApiKey, setApiKey } from "@/lib/store";

export default function Settings() {
  const [key, setKey] = useState(getApiKey);
  const [saved, setSaved] = useState(false);

  function save() {
    setApiKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Shell title="Settings">
      <Card className="mb-4">
        <Label>Hevy API Key</Label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Paste your Hevy API key"
          autoComplete="off"
          className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm"
        />
        <p className="mt-3 text-xs text-muted">Get your key at hevy.com/settings → Developer (requires Hevy Pro).</p>
      </Card>
      <button onClick={save} className="w-full rounded-xl bg-orange-500 py-4 font-bold text-white active:opacity-80">
        {saved ? "Saved ✓" : "Save"}
      </button>
    </Shell>
  );
}
