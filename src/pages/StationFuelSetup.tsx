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
  fuelPrices?: Record<string, number>;
  [key: string]: unknown;
};

type StationFuelSetupProps = {
  officer: StationOfficer | null;
  onBack  : () => void;
  onSave  : (payload: { fuelCapacities: Record<string, number>; fuelPrices: Record<string, number> }) => void;
};

function fuelVisual(name: string) {
  const n = name.toLowerCase();
  if (n.includes("diesel")) {
    return {
      gradient: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
      border  : "#86efac",
      text    : "#166534",
    };
  }
  if (n.includes("premium")) {
    return {
      gradient: "linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)",
      border  : "#fdba74",
      text    : "#9a3412",
    };
  }
  return {
    gradient: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
    border  : "#fca5a5",
    text    : "#991b1b",
  };
}

export default function StationFuelSetup({ officer, onBack, onSave }: StationFuelSetupProps) {
  const fuelNames = useMemo(() => {
    const af = officer?.availableFuels;
    if (Array.isArray(af) && af.length > 0) return [...af];
    return [...STANDARD_FUELS];
  }, [officer?.availableFuels]);

  const [capacities, setCapacities] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fc = officer?.fuelCapacities;
    const fp = officer?.fuelPrices;
    const nextCap: Record<string, string> = {};
    const nextPrice: Record<string, string> = {};
    const hasSavedCap =
      fc != null && typeof fc === "object" && Object.keys(fc as object).length > 0;

    for (const k of fuelNames) {
      const capVal = fc && typeof (fc as Record<string, number>)[k] === "number"
        ? (fc as Record<string, number>)[k]
        : undefined;
      const priceVal = fp && typeof (fp as Record<string, number>)[k] === "number"
        ? (fp as Record<string, number>)[k]
        : undefined;
      if (capVal != null) nextCap[k] = String(capVal);
      else nextCap[k] = hasSavedCap ? "" : "5000";
      nextPrice[k] = priceVal != null ? String(priceVal) : "72.50";
    }
    setCapacities(nextCap);
    setPrices(nextPrice);
  }, [officer, fuelNames.join("|")]);

  const handleSave = () => {
    const outCap: Record<string, number> = {};
    const outPrice: Record<string, number> = {};
    for (const name of fuelNames) {
      const c = parseFloat(capacities[name] || "");
      const p = parseFloat(prices[name] || "");
      if (isNaN(c) || c <= 0) {
        setError(`Enter a valid capacity (liters) for "${name}".`);
        return;
      }
      if (isNaN(p) || p < 0) {
        setError(`Enter a valid price for "${name}".`);
        return;
      }
      outCap[name] = c;
      outPrice[name] = Math.round(p * 100) / 100;
    }
    setError("");
    onSave({ fuelCapacities: outCap, fuelPrices: outPrice });
  };

  const brand = officer?.brand ? String(officer.brand) : "Station";

  return (
    <div className="flex flex-col min-h-dvh bg-[#f5f7fb]">
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 shadow-md"
        style={{
          background: "linear-gradient(135deg, #003366 0%, #001e40 100%)",
        }}
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
            {brand} · capacity &amp; price per liter
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
          Set on-hand capacity (liters) and your selling price per liter for each fuel. Totals update on your dashboard after you save.
        </p>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium px-4 py-3">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {fuelNames.map((name) => {
            const vis = fuelVisual(name);
            return (
              <section
                key={name}
                className="rounded-2xl border-2 overflow-hidden shadow-sm bg-white"
                style={{ borderColor: vis.border }}
              >
                <div
                  className="px-4 py-3 flex flex-col gap-1"
                  style={{ background: vis.gradient }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="material-symbols-outlined shrink-0 mt-0.5"
                      style={{ color: vis.text, fontSize: "22px", fontVariationSettings: "'FILL' 1" }}
                    >
                      local_gas_station
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[10px] font-black uppercase tracking-widest leading-none mb-1"
                        style={{ color: vis.text }}
                      >
                        Fuel type
                      </p>
                      <p
                        className="font-headline font-black text-lg sm:text-xl leading-tight"
                        style={{ color: vis.text }}
                      >
                        {name}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3 bg-white">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Capacity (L)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      aria-label={`Capacity in liters for ${name}`}
                      value={capacities[name] ?? ""}
                      onChange={(e) => {
                        setCapacities((prev) => ({ ...prev, [name]: e.target.value }));
                        setError("");
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-[#003366] outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Price / L (₱)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      aria-label={`Price per liter in pesos for ${name}`}
                      value={prices[name] ?? ""}
                      onChange={(e) => {
                        setPrices((prev) => ({ ...prev, [name]: e.target.value }));
                        setError("");
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-[#003366] outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]"
                    />
                  </div>
                </div>
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
