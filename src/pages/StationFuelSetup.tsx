import { useEffect, useMemo, useState } from "react";

const STANDARD_FUELS = [
  "Diesel",
  "Premium Diesel",
  "Regular/Unleaded (91)",
  "Premium (95)",
  "Super Premium (97)",
] as const;

export type StationOfficer = {
  brand?: string;
  availableFuels?: string[];
  fuelCapacities?: Record<string, number>;
  fuelInventory?: Record<string, number>;
  fuelPrices?: Record<string, number>;
  [key: string]: unknown;
};

type StationFuelSetupProps = {
  officer: StationOfficer | null;
  onBack  : () => void;
  onSave  : (payload: { fuelInventory: Record<string, number>; fuelCapacities: Record<string, number>; fuelPrices: Record<string, number> }) => void;
};

function fuelVisual(name: string) {
  const n = name.toLowerCase();
  if (n.includes("premium diesel")) {
    return { gradient: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", border: "#86efac", text: "#166534" };
  }
  if (n.includes("diesel")) {
    return { gradient: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", border: "#cbd5e1", text: "#475569" };
  }
  if (n.includes("regular") || n.includes("unleaded")) {
    return { gradient: "linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)", border: "#fde047", text: "#854d0e" };
  }
  if (n.includes("super premium")) {
    return { gradient: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)", border: "#93c5fd", text: "#1d4ed8" };
  }
  if (n.includes("premium")) {
    return { gradient: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)", border: "#fca5a5", text: "#991b1b" };
  }
  return { gradient: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", border: "#e2e8f0", text: "#64748b" };
}

export default function StationFuelSetup({ officer, onBack, onSave }: StationFuelSetupProps) {
  // Always show all fuels so disabled ones can be re-enabled
  const fuelNames = useMemo(() => [...STANDARD_FUELS], []);

  const [inventory, setInventory] = useState<Record<string, string>>({});
  const [topUpAmounts, setTopUpAmounts] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [enabledFuels, setEnabledFuels] = useState<Set<string>>(new Set(fuelNames));
  const [error, setError] = useState("");

  useEffect(() => {
    const fc = officer?.fuelCapacities;
    const fi = officer?.fuelInventory;
    const fp = officer?.fuelPrices;
    const af = officer?.availableFuels;

    const nextInv: Record<string, string> = {};
    const nextPrice: Record<string, string> = {};

    for (const k of fuelNames) {
      // Current inventory: use saved inventory, fall back to capacity, then 0
      const invVal = fi && typeof (fi as Record<string, number>)[k] === "number"
        ? (fi as Record<string, number>)[k]
        : fc && typeof (fc as Record<string, number>)[k] === "number"
          ? (fc as Record<string, number>)[k]
          : undefined;
      nextInv[k] = invVal != null ? String(invVal) : "0";
      nextPrice[k] = fp && typeof (fp as Record<string, number>)[k] === "number"
        ? String((fp as Record<string, number>)[k])
        : "72.50";
    }

    setInventory(nextInv);
    setPrices(nextPrice);
    setTopUpAmounts({});

    if (Array.isArray(af) && af.length > 0) {
      setEnabledFuels(new Set(af));
    } else {
      setEnabledFuels(new Set(fuelNames));
    }
  }, [officer]);

  const handleTopUp = (name: string) => {
    const add = parseFloat(topUpAmounts[name] || "");
    if (isNaN(add) || add <= 0) return;
    const maxCap = officer?.fuelCapacities
      ? ((officer.fuelCapacities as Record<string, number>)[name] ?? 1500)
      : 1500;
    const current = parseFloat(inventory[name] || "0");
    if (current >= maxCap || current + add > maxCap) {
      setError(`Cannot add ${add} L — it would exceed the max capacity of ${maxCap.toLocaleString()} L. You can add up to ${Math.max(0, maxCap - current).toLocaleString()} L more.`);
      return;
    }
    setInventory((prev) => ({ ...prev, [name]: String(current + add) }));
    setTopUpAmounts((prev) => ({ ...prev, [name]: "" }));
    setError("");
  };

  const handleSave = () => {
    if (enabledFuels.size === 0) {
      setError("Please enable at least one fuel type.");
      return;
    }
    const outInv: Record<string, number> = {};
    const outCap: Record<string, number> = {};
    const outPrice: Record<string, number> = {};
    for (const name of fuelNames) {
      if (!enabledFuels.has(name)) continue;
      const inv = parseFloat(inventory[name] || "");
      const p = parseFloat(prices[name] || "");
      if (isNaN(inv) || inv < 0) {
        setError(`Enter a valid current inventory for "${name}".`);
        return;
      }
      const cap = officer?.fuelCapacities
        ? ((officer.fuelCapacities as Record<string, number>)[name] ?? 1500)
        : 1500;
      if (inv > cap) {
        setError(`Current inventory for "${name}" cannot exceed its max capacity of ${cap.toLocaleString()} L.`);
        return;
      }
      if (isNaN(p) || p < 0) {
        setError(`Enter a valid price for "${name}".`);
        return;
      }
      outInv[name] = inv;
      outCap[name] = cap;
      outPrice[name] = Math.round(p * 100) / 100;
    }
    setError("");
    onSave({ fuelInventory: outInv, fuelCapacities: outCap, fuelPrices: outPrice });
  };

  const brand = officer?.brand ? String(officer.brand) : "Station";

  return (
    <div className="flex flex-col min-h-dvh bg-[#f5f7fb]">
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 shadow-md"
        style={{ background: "linear-gradient(135deg, #003366 0%, #001e40 100%)" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full text-white/90 hover:bg-white/10 active:scale-95 transition-all"
          aria-label="Back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-headline font-black text-white text-lg leading-tight truncate">
            Fuel &amp; pricing
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 truncate">
            {brand} · inventory &amp; price per liter
          </p>
        </div>
        <span
          className="material-symbols-outlined text-yellow-400 shrink-0"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          local_gas_station
        </span>
      </header>

      <main className="flex-1 px-4 py-5 pb-28 max-w-lg mx-auto w-full space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Update current inventory and price per liter. Use <strong>Top Up</strong> to add incoming supply — it adds to the current stock up to the max capacity.
        </p>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium px-4 py-3">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {fuelNames.map((name) => {
            const vis = fuelVisual(name);
            const isEnabled = enabledFuels.has(name);
            const maxCap = officer?.fuelCapacities
              ? ((officer.fuelCapacities as Record<string, number>)[name] ?? 1500)
              : 1500;
            const topUpVal = parseFloat(topUpAmounts[name] || "");
            const currentVal = parseFloat(inventory[name] || "0");
            const previewAfterTopUp = !isNaN(topUpVal) && topUpVal > 0
              ? currentVal + topUpVal
              : null;

            return (
              <section
                key={name}
                className={`rounded-2xl border-2 overflow-hidden shadow-sm bg-white transition-opacity ${isEnabled ? "opacity-100" : "opacity-60"}`}
                style={{ borderColor: isEnabled ? vis.border : "#e2e8f0" }}
              >
                {/* Card header */}
                <div
                  className="px-4 py-3"
                  style={{ background: isEnabled ? vis.gradient : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="material-symbols-outlined shrink-0"
                      style={{ color: isEnabled ? vis.text : "#94a3b8", fontSize: "22px", fontVariationSettings: "'FILL' 1" }}
                    >
                      local_gas_station
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-0.5" style={{ color: isEnabled ? vis.text : "#94a3b8" }}>Fuel type</p>
                      <p className="font-headline font-black text-lg leading-tight" style={{ color: isEnabled ? vis.text : "#94a3b8" }}>{name}</p>
                    </div>
                    {/* Toggle */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      onClick={() => {
                        setEnabledFuels((prev) => {
                          const next = new Set(prev);
                          if (next.has(name)) next.delete(name); else next.add(name);
                          return next;
                        });
                        setError("");
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${isEnabled ? "bg-[#003366]" : "bg-slate-300"}`}
                    >
                      <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform duration-200 ${isEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                </div>

                {isEnabled && (
                  <div className="p-4 space-y-3 bg-white">
                    {/* Capacity (read-only) + Current */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Max Capacity (L)</label>
                        <div className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-400">
                          {maxCap.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Current (L)</label>
                        <input
                          type="number"
                          min={0}
                          max={maxCap ?? undefined}
                          step={1}
                          aria-label={`Current inventory for ${name}`}
                          value={inventory[name] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const num = parseFloat(val);
                            if (maxCap != null && !isNaN(num) && num > maxCap) {
                              setInventory((prev) => ({ ...prev, [name]: String(maxCap) }));
                            } else {
                              setInventory((prev) => ({ ...prev, [name]: val }));
                            }
                            setError("");
                          }}
                          className={`w-full rounded-xl border px-3 py-2.5 text-sm font-bold text-[#003366] outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] ${
                            parseFloat(inventory[name] || "0") >= maxCap
                              ? "border-amber-400 bg-amber-50"
                              : "border-slate-200"
                          }`}
                        />
                        {parseFloat(inventory[name] || "0") >= maxCap && (
                          <p className="text-[10px] text-amber-600 font-bold mt-0.5">At max capacity</p>
                        )}
                      </div>
                    </div>

                    {/* Top Up row */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Top Up Supply (L)
                        {currentVal < maxCap && (
                          <span className="ml-2 normal-case font-medium text-slate-400">
                            ({(maxCap - currentVal).toLocaleString()} L available)
                          </span>
                        )}
                      </label>
                      {previewAfterTopUp != null && currentVal + (parseFloat(topUpAmounts[name] || "0")) <= maxCap && (
                        <p className="text-[10px] font-medium text-emerald-600 mb-1">
                          → {previewAfterTopUp.toLocaleString()} L after adding
                        </p>
                      )}
                      {parseFloat(topUpAmounts[name] || "0") > 0 && currentVal + parseFloat(topUpAmounts[name] || "0") > maxCap && (
                        <p className="text-[10px] font-bold text-red-500 mb-1">
                          Exceeds capacity — max you can add is {Math.max(0, maxCap - currentVal).toLocaleString()} L
                        </p>
                      )}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-600">+</span>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            placeholder="0"
                            aria-label={`Top up amount for ${name}`}
                            value={topUpAmounts[name] ?? ""}
                            onChange={(e) => { setTopUpAmounts((prev) => ({ ...prev, [name]: e.target.value })); }}
                            className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2.5 text-sm font-bold text-[#003366] outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTopUp(name)}
                          disabled={
                            isNaN(parseFloat(topUpAmounts[name] || "")) ||
                            parseFloat(topUpAmounts[name] || "") <= 0 ||
                            currentVal >= maxCap ||
                            currentVal + parseFloat(topUpAmounts[name] || "0") > maxCap
                          }
                          className="shrink-0 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-500 text-white"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Price / L (₱)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        aria-label={`Price per liter for ${name}`}
                        value={prices[name] ?? ""}
                        onChange={(e) => { setPrices((prev) => ({ ...prev, [name]: e.target.value })); setError(""); }}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-[#003366] outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]"
                      />
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-slate-200 safe-area-pb">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 border-2 border-slate-200 text-[#003366] font-headline font-bold py-3.5 rounded-xl active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-[#003366] text-white font-headline font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all"
            style={{ boxShadow: "0 8px 24px rgba(0,51,102,0.35)" }}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

