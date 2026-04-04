import { useEffect, useMemo, useState } from "react";
import { formatDecodedDate, type DecodedQR } from "@/lib/qr/qrCodec";
import BottomNav from "@/shared/components/navigation/BottomNav";
import {
  recordDispenseTransaction,
  resolveResidentFromQR,
  type ResolvedResidentScan,
  type StationAccount,
  WEEKLY_FUEL_LIMIT,
} from "@/lib/data/agas";

type OfficerFuel = {
  officerFirstName?: string;
  firstName?: string;
  brand?: string;
  fuelPrices?: Record<string, number>;
};

/** Fallback ₱/L when station has not set a price for that product (aligned with Dashboard mock defaults). */
const DEFAULT_FUEL_PRICES: Record<string, number> = {
  Diesel: 68.25,
  "Premium Diesel": 70.1,
  "Regular/Unleaded (91)": 72.5,
  "Premium (95)": 75.9,
  "Super Premium (97)": 78.4,
};

function pricePerLiterFor(officer: OfficerFuel | undefined, fuelName: string): number {
  const p = officer?.fuelPrices?.[fuelName];
  if (typeof p === "number" && Number.isFinite(p) && p > 0) return p;
  return DEFAULT_FUEL_PRICES[fuelName] ?? 72.5;
}

/** Pesos with centavos always shown (2 decimal places), for labels only. */
function formatPeso(n: number): string {
  return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** For controlled `type="number"` cash field — no grouping so `parseFloat` stays correct. */
function pesoInputString(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/** Show liters derived from exact cash (avoid misleading 2dp when cash is the source of truth). */
function formatLitersFromExactCash(liters: number): string {
  const s = liters.toFixed(4);
  return s.replace(/0+$/, "").replace(/\.$/, "") || "0";
}

type ValidationSuccessProps = {
  officer?: StationAccount | null;
  scannedResident?: DecodedQR | null;
  onBack: () => void;
  onDispenseSuccess: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
};

function normalizeFuelType(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function getFuelOptions(officer: StationAccount | null | undefined, gasType: string | null | undefined): string[] {
  const availableFuels = Array.isArray(officer?.availableFuels) && officer.availableFuels.length > 0
    ? officer.availableFuels
    : Object.keys(officer?.fuelPrices ?? {});

  const wantsDiesel = normalizeFuelType(gasType).includes("diesel");
  const filtered = availableFuels.filter((item) => {
    const isDiesel = item.toLowerCase().includes("diesel");
    return wantsDiesel ? isDiesel : !isDiesel;
  });

  return filtered.length > 0 ? filtered : availableFuels;
}

function fuelTypeTheme(fuelType: string) {
  const normalized = fuelType.toLowerCase();
  if (normalized.includes("diesel")) {
    return { bgFrom: "#dcfce7", bgTo: "#bbf7d0", border: "#86efac", text: "#166534" };
  }
  if (normalized.includes("regular") || normalized.includes("unleaded")) {
    return { bgFrom: "#fee2e2", bgTo: "#fecaca", border: "#fca5a5", text: "#991b1b" };
  }
  return { bgFrom: "#ffedd5", bgTo: "#fed7aa", border: "#fdba74", text: "#9a3412" };
}

export default function ValidationSuccess({
  officer,
  scannedResident,
  onBack,
  onDispenseSuccess,
  activeTab,
  onTabChange,
}: ValidationSuccessProps) {
  const [resolvedResident, setResolvedResident] = useState<ResolvedResidentScan | null>(null);
  const [loadingResident, setLoadingResident] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [literInput, setLiterInput] = useState("");
  const [cashInput, setCashInput] = useState("");
  const [inputMode, setInputMode] = useState<"liters" | "cash">("liters");
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!scannedResident) {
      setResolvedResident(null);
      setLookupError("No QR payload was provided.");
      return;
    }

    let cancelled = false;
    setLoadingResident(true);
    setLookupError("");
    setActionError("");

    void resolveResidentFromQR(scannedResident)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setResolvedResident(null);
          setLookupError("Resident record was not found for this QR code.");
          return;
        }
        setResolvedResident(result);
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedResident(null);
          setLookupError("Could not validate this QR code against live resident data.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingResident(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [scannedResident]);

  const fuelOptionButtons = useMemo(
    () => getFuelOptions(officer, resolvedResident?.resident.gasType ?? scannedResident?.gasType),
    [officer, resolvedResident?.resident.gasType, scannedResident?.gasType],
  );

  const [selectedFuelOption, setSelectedFuelOption] = useState("");

  useEffect(() => {
    setSelectedFuelOption((current) => {
      if (current && fuelOptionButtons.includes(current)) return current;
      return fuelOptionButtons[0] ?? "";
    });
  }, [fuelOptionButtons]);

  const resident = resolvedResident?.resident;
  const firstName = resident?.firstName || scannedResident?.firstName || scannedResident?.firstCode || "Unknown";
  const lastName = resident?.lastName || scannedResident?.lastName || scannedResident?.lastCode || "Resident";
  const plateNumber = resident?.plate || scannedResident?.plate || "N/A";
  const vehicleType = resident?.vehicleType || scannedResident?.vehicleType || "Vehicle";
  const registeredAt = resident?.registeredAt
    ? formatDecodedDate(new Date(resident.registeredAt))
    : scannedResident?.registeredAt
      ? formatDecodedDate(new Date(scannedResident.registeredAt))
      : scannedResident?.date
        ? formatDecodedDate(new Date(scannedResident.date))
        : null;

  const fuelConsumed = resolvedResident?.usedLiters ?? scannedResident?.fuelUsed ?? 0;
  const fuelLimit = resident?.fuelAllocation ?? scannedResident?.fuelAllocation ?? WEEKLY_FUEL_LIMIT;
  const hasAllocationSource =
    resolvedResident?.remainingLiters != null ||
    scannedResident?.fuelAllocation != null ||
    scannedResident?.fuelUsed != null;
  const remainingLiters = hasAllocationSource
    ? Math.max(fuelLimit - fuelConsumed, 0)
    : 0;
  const inputLiters = parseFloat(literInput);
  const previewDeduct = !Number.isNaN(inputLiters) && inputLiters > 0 ? inputLiters : 0;
  const previewRemaining = Math.max(remainingLiters - previewDeduct, 0);
  const selectedPrice = Number(officer?.fuelPrices?.[selectedFuelOption] ?? 0);
  const selectedInventory = Number(officer?.fuelInventory?.[selectedFuelOption] ?? 0);
  const selectedTheme = fuelTypeTheme(selectedFuelOption || resolvedResident?.resident.gasType || "Fuel");
  const isLow = previewRemaining <= 7;
  const circleColor = isLow ? "#dc2626" : "#16a34a";
  const allocationBg = isLow ? "#fef2f2" : "#f0fdf4";
  const allocationBorder = isLow ? "#fca5a5" : "#e5e5eb";
  const textColor = isLow ? "#dc2626" : "#15803d";
  const textMutedColor = isLow ? "#991b1b" : "#166534";
  const barColor = isLow ? "#ef4444" : "#16a34a";

  const handleConfirmDispense = async () => {
    const liters = parseFloat(literInput);
    if (Number.isNaN(liters) || liters <= 0) {
      setActionError("Please enter liters before confirming dispense.");
      return;
    }

    if (!resident?.uid || !officer?.uid) {
      setActionError("Resident or station account data is missing.");
      return;
    }

    if (liters > remainingLiters) {
      setShowLimitModal(true);
      return;
    }

    if (liters > selectedInventory) {
      setActionError("Station inventory is not enough for this request.");
      return;
    }

    if (!selectedFuelOption) {
      setActionError("Select a fuel type before confirming.");
      return;
    }

    setSubmitting(true);
    setActionError("");

    try {
      await recordDispenseTransaction({
        stationUid: officer.uid,
        residentUid: resident.uid,
        liters,
        fuelType: selectedFuelOption,
      });
      onDispenseSuccess();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to record this dispense transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh bg-surface relative">
      <main
        className="flex-1 pt-2 pb-36 px-4 max-w-md mx-auto w-full"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20zm20-20h20v20H20V0z' fill='%23003366' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E\")",
        }}
      >
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 text-center relative" style={{ background: "linear-gradient(135deg, #003366 0%, #001e40 100%)" }}>
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20zm20-20h20v20H20V0z' fill='%23003366' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E\")",
              }}
            />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 bg-[#2e7d32] rounded-full flex items-center justify-center mb-3 shadow-xl">
                <span className="material-symbols-outlined text-3xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <h2 className="font-headline font-black text-white text-xl tracking-tight uppercase">Validated</h2>
              <p className="text-on-primary-container font-medium text-xs mt-0.5">Transaction Authorized</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {(loadingResident || lookupError) && (
              <div className={`rounded-xl border px-4 py-3 text-sm ${
                loadingResident
                  ? "bg-slate-50 border-slate-200 text-slate-500"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
                {loadingResident ? "Loading live resident data..." : lookupError}
              </div>
            )}

            <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
              <p className="text-outline text-xs font-bold tracking-widest uppercase text-center">Verified Resident</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white p-2.5">
                  <p className="text-outline text-[9px] font-bold uppercase tracking-wider">First Name</p>
                  <p className="font-headline font-black text-xl text-[#003366] tracking-widest">{firstName}</p>
                </div>
                <div className="rounded-lg bg-white p-2.5">
                  <p className="text-outline text-[9px] font-bold uppercase tracking-wider">Last Name</p>
                  <p className="font-headline font-black text-xl text-[#003366] tracking-widest">{lastName}</p>
                </div>
              </div>
              <div className="rounded-lg bg-white p-3 text-center">
                <p className="text-outline text-[10px] font-bold uppercase tracking-wider">Plate Number</p>
                <p className="font-headline font-black text-4xl text-[#003366] tracking-widest leading-none mt-1">{plateNumber}</p>
                <p className="text-outline text-xs font-bold uppercase tracking-wider mt-2">Vehicle Type</p>
                <p className="font-headline font-bold text-xl text-on-surface">{vehicleType}</p>
              </div>
              {selectedFuelOption && (
                <div
                  className="mx-auto w-full max-w-[260px] rounded-full border px-4 py-2 flex items-center justify-center gap-2 shadow-sm"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${selectedTheme.bgFrom}, ${selectedTheme.bgTo})`,
                    borderColor: selectedTheme.border,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: selectedTheme.text, fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
                  >
                    local_gas_station
                  </span>
                  <div className="text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wider leading-none" style={{ color: selectedTheme.text }}>Dispense Fuel</p>
                    <p className="text-lg font-black leading-tight" style={{ color: selectedTheme.text }}>{selectedFuelOption}</p>
                  </div>
                </div>
              )}
              {registeredAt && (
                <p className="text-outline text-[11px] text-center">Registered: {registeredAt}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl p-3 sm:p-4 border overflow-hidden" style={{ background: allocationBg, borderColor: allocationBorder }}>
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider" style={{ color: textMutedColor }}>Fuel Allocation</p>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <span className="material-symbols-outlined text-base sm:text-lg" style={{ color: textColor, fontVariationSettings: "'FILL' 1" }}>
                        local_gas_station
                      </span>
                      <p className="text-3xl sm:text-5xl font-black font-headline leading-none" style={{ color: textColor }}>
                        {previewRemaining.toFixed(1)}
                      </p>
                      <span className="text-xl sm:text-3xl" style={{ color: textColor }}>Liters</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold mt-1" style={{ color: textColor }}>Remaining</p>
                  </div>
                  {(() => {
                    const pct = Math.round((previewRemaining / fuelLimit) * 100);
                    const radius = 22;
                    const circumference = 2 * Math.PI * radius;
                    const dash = (pct / 100) * circumference;
                    return (
                      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                        <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90 absolute inset-0">
                          <circle cx="32" cy="32" r={radius} fill="none" stroke={allocationBorder} strokeWidth="5" />
                          <circle
                            cx="32"
                            cy="32"
                            r={radius}
                            fill="none"
                            stroke={circleColor}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${dash} ${circumference}`}
                          />
                        </svg>
                        <div className="relative flex flex-col items-center leading-none">
                          <span className="text-sm font-black" style={{ color: circleColor }}>{pct}%</span>
                          <span className="text-[8px] font-bold uppercase" style={{ color: circleColor }}>Left</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-3 h-3 sm:h-4 w-full rounded-full bg-white/70 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-2"
                    style={{ backgroundColor: barColor, width: `${Math.min((fuelConsumed / fuelLimit) * 100, 100)}%` }}
                  >
                    <span className="text-[8px] sm:text-[9px] font-black text-white whitespace-nowrap">{fuelConsumed.toFixed(1)}L used</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-end text-base sm:text-2xl font-bold" style={{ color: textColor }}>
                  <span className="text-right">Total: {fuelLimit} L / week</span>
                </div>
              </div>

              <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-3">
                <label className="text-outline text-[12px] font-bold uppercase tracking-wider">Input Liter</label>
                <div className={`grid gap-2 ${fuelOptionButtons.length <= 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
                  {fuelOptionButtons.map((option) => {
                    const active = selectedFuelOption === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSelectedFuelOption(option);
                          setActionError("");
                        }}
                        className={`rounded-lg border py-2.5 px-2 text-xs sm:text-sm font-bold active:scale-95 transition-all ${
                          active
                            ? "bg-[#003366] text-white border-[#003366]"
                            : "bg-white text-[#003366] border-outline-variant/40 hover:bg-slate-50"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {selectedFuelOption && (
                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-white p-3 border border-outline-variant/20">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Price / Liter</p>
                      <p className="text-lg font-black text-[#003366]">₱{selectedPrice.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Station Stock</p>
                      <p className="text-lg font-black text-[#003366]">{selectedInventory.toFixed(1)} L</p>
                    </div>
                  </div>
                )}

                {remainingLiters <= 0 ? (
                  <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold px-4 py-3 text-center">
                    No allocation remaining. This resident has used the full weekly limit.
                  </div>
                ) : (
                  <>
                    <input
                      type="number"
                      min="0"
                      max={Math.min(remainingLiters, selectedInventory)}
                      step="0.1"
                      value={literInput}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        const maxValue = Math.min(remainingLiters, selectedInventory || remainingLiters);
                        if (!Number.isNaN(value) && value > maxValue) {
                          setLiterInput(String(maxValue));
                        } else {
                          setLiterInput(e.target.value);
                        }
                        setActionError("");
                      }}
                      placeholder={`Max ${Math.min(remainingLiters, selectedInventory || remainingLiters).toFixed(1)} L`}
                      className="w-full rounded-lg border border-outline-variant/30 px-4 py-3 text-on-surface bg-white outline-none focus:border-[#003366]"
                    />
                    <div className="grid grid-cols-5 gap-2">
                      {[2, 5, 10, 15, 20].map((amount) => {
                        const exceeds = amount > remainingLiters || amount > selectedInventory;
                        return (
                          <button
                            key={amount}
                            type="button"
                            disabled={exceeds}
                            onClick={() => {
                              setLiterInput(String(amount));
                              setActionError("");
                            }}
                            className={`rounded-lg border py-2.5 text-sm font-bold transition-all ${
                              exceeds
                                ? "border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed"
                                : "border-outline-variant/40 bg-white text-[#003366] active:scale-95 hover:bg-slate-50"
                            }`}
                          >
                            {amount} L
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-500 -mt-1">
                      Max ₱{formatPeso(maxCashForAllocation)} · {remainingLiters.toFixed(1)} L allocation
                    </p>

                    {inputMode === "liters" ? (
                      <div className="grid grid-cols-5 gap-2">
                        {[2, 5, 10, 15, 20].map((amount) => {
                          const exceeds = amount > remainingLiters;
                          return (
                            <button
                              key={amount}
                              type="button"
                              disabled={exceeds}
                              onClick={() => {
                                if (exceeds) return;
                                const Lc = Math.min(amount, remainingLiters);
                                let cash = Math.round(Lc * pricePerLiter * 100) / 100;
                                if (cash > maxCashForAllocation) {
                                  cash = maxCashForAllocation;
                                  setCashInput(pesoInputString(cash));
                                  const L2 = Math.min(remainingLiters, cash / pricePerLiter);
                                  setLiterInput(L2 > 0 ? formatLitersFromExactCash(L2) : "");
                                } else {
                                  setLiterInput(String(Lc));
                                  setCashInput(pesoInputString(cash));
                                }
                                setActionError("");
                              }}
                              className={`rounded-lg border py-2.5 text-sm font-bold transition-all ${
                                exceeds
                                  ? "border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed"
                                  : "border-outline-variant/40 bg-white text-[#003366] active:scale-95 hover:bg-slate-50"
                              }`}
                            >
                              {amount} L
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {[50, 100, 500, 1000].map((peso) => {
                          const exceeds = peso > maxCashForAllocation;
                          const approxL = pricePerLiter > 0 ? peso / pricePerLiter : 0;
                          return (
                            <button
                              key={peso}
                              type="button"
                              disabled={exceeds}
                              onClick={() => {
                                if (exceeds) return;
                                setCashInput(pesoInputString(peso));
                                const L =
                                  pricePerLiter > 0
                                    ? Math.min(remainingLiters, peso / pricePerLiter)
                                    : 0;
                                setLiterInput(L > 0 ? formatLitersFromExactCash(L) : "");
                                setActionError("");
                              }}
                              className={`rounded-lg border py-2.5 px-1 text-xs sm:text-sm font-bold transition-all leading-tight ${
                                exceeds
                                  ? "border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed"
                                  : "border-outline-variant/40 bg-white text-[#003366] active:scale-95 hover:bg-slate-50"
                              }`}
                            >
                              <span className="block">₱{formatPeso(peso)}</span>
                              {!exceeds && approxL > 0 && (
                                <span className="block font-medium text-[9px] text-slate-500 mt-0.5">
                                  ≈ {formatLitersFromExactCash(approxL)} L
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="bg-tertiary-fixed/30 border-l-4 border-tertiary p-4 rounded-r-lg flex gap-3">
              <span className="material-symbols-outlined text-tertiary shrink-0">info</span>
              <p className="text-sm text-on-tertiary-fixed-variant leading-tight">
                This dispense is recorded against live resident allocation and live station inventory.
              </p>
            </div>

            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm font-medium px-4 py-3 rounded-xl">
                {actionError}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => void handleConfirmDispense()}
                disabled={
                  loadingResident ||
                  submitting ||
                  !resident?.uid ||
                  remainingLiters <= 0 ||
                  !literInput ||
                  parseFloat(literInput) <= 0
                }
                className={`w-full font-headline font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                  !loadingResident &&
                  !submitting &&
                  resident?.uid &&
                  remainingLiters > 0 &&
                  literInput &&
                  parseFloat(literInput) > 0
                    ? "bg-[#2e7d32] text-white active:scale-95 active:bg-[#1b5e20]"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span className="material-symbols-outlined">gas_meter</span>
                {submitting ? "Recording Dispense..." : "Confirm Dispense"}
              </button>
              <button
                onClick={onBack}
                className="w-full bg-surface-container-high text-on-surface-variant font-headline font-bold py-4 rounded-xl active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-outline text-xs space-y-1 pb-4">
          <p>© 2026 Mata Technologies Inc.</p>
          <p>Ref ID: VAL-9823-CEB-2024</p>
        </div>
      </main>

      <BottomNav active={activeTab} onChange={onTabChange} />

      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <span className="material-symbols-outlined text-red-600" style={{ fontSize: "32px", fontVariationSettings: "'FILL' 1" }}>
                  warning
                </span>
              </div>
              <h3 className="text-xl font-headline font-bold text-[#003366]">Fuel Limit Reached</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                This fuel request exceeds the allowed limit for this resident.
              </p>
              <div className="mt-4 w-full rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                <p><span className="font-semibold">Consumed:</span> {fuelConsumed.toFixed(1)}L</p>
                <p><span className="font-semibold">Limit:</span> {fuelLimit}L</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLimitModal(false)}
                className="mt-5 w-full rounded-xl bg-[#003366] py-3 font-headline font-bold text-white active:scale-95 transition-all"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

