import { useState } from "react";
import { formatDecodedDate } from "@/lib/qr/qrCodec";
import BottomNav from "@/shared/components/navigation/BottomNav";

type ValidationSuccessProps = {
  officer?: { officerFirstName?: string; firstName?: string; brand?: string };
  scannedResident?: {
    firstCode?: string;
    lastCode?: string;
    date?: Date | string;
    gasType?: string;
    serial?: string;
  } | null;
  onBack: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export default function ValidationSuccess({ scannedResident, onBack, activeTab, onTabChange }: ValidationSuccessProps) {
  const firstName = scannedResident?.firstCode || "JCX";
  const lastName = scannedResident?.lastCode || "LEQ";
  const plateNumber = "ABC-1234";
  const vehicleType = "Motorcycle";
  const registeredAt = scannedResident?.date
    ? formatDecodedDate(new Date(scannedResident.date))
    : null;

  const [fuelConsumed, setFuelConsumed] = useState(12);
  const [fuelLimit] = useState(20);
  const [literInput, setLiterInput] = useState("");
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [actionError, setActionError] = useState("");
  const remainingLiters = Math.max(fuelLimit - fuelConsumed, 0);
  const inputLiters = parseFloat(literInput);
  const previewDeduct = !isNaN(inputLiters) && inputLiters > 0 ? inputLiters : 0;
  const previewRemaining = Math.max(remainingLiters - previewDeduct, 0);

  const handleConfirmDispense = () => {
    const liters = parseFloat(literInput);
    if (isNaN(liters) || liters <= 0) {
      setActionError("Please enter liters before confirming dispense.");
      return;
    }
    if (fuelConsumed + liters > fuelLimit) {
      setShowLimitModal(true);
      return;
    }
    setFuelConsumed((prev) => prev + liters);
    setActionError("");
    onBack();
  };
  const gasTypeFromQR = (scannedResident?.gasType ?? "").trim();
  const isDieselType = gasTypeFromQR.toLowerCase().includes("diesel");
  const fuelOptionButtons = isDieselType
    ? ["Diesel", "Premium Diesel"]
    : ["Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)"];

  const [selectedFuelOption, setSelectedFuelOption] = useState<string>(() => {
    if (gasTypeFromQR && fuelOptionButtons.includes(gasTypeFromQR)) return gasTypeFromQR;
    return fuelOptionButtons[0] || "";
  });

  const displayFuelType = selectedFuelOption.toLowerCase().includes("diesel")
    ? "Diesel"
    : "Gasoline";

  const fuelTypeTheme = selectedFuelOption.toLowerCase().includes("diesel")
    ? { bgFrom: "#dcfce7", bgTo: "#bbf7d0", border: "#86efac", text: "#166534" }
    : selectedFuelOption.toLowerCase().includes("regular")
      ? { bgFrom: "#fee2e2", bgTo: "#fecaca", border: "#fca5a5", text: "#991b1b" }
      : { bgFrom: "#ffedd5", bgTo: "#fed7aa", border: "#fdba74", text: "#9a3412" };
  const isLow = previewRemaining <= 7;
  const circleColor    = isLow ? "#dc2626" : "#16a34a";
  const allocationBg   = isLow ? "#fef2f2" : "#f0fdf4";
  const allocationBorder = isLow ? "#fca5a5" : "#e5e5eb";
  const textColor      = isLow ? "#dc2626" : "#15803d";
  const textMutedColor = isLow ? "#991b1b" : "#166534";
  const barColor       = isLow ? "#ef4444" : "#16a34a";


  return (
    <div className="flex flex-col min-h-dvh bg-surface relative">
      <main
        className="flex-1 pt-2 pb-36 px-4 max-w-md mx-auto w-full"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20zm20-20h20v20H20V0z' fill='%23003366' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E\")",
        }}
      >
        <div className=" bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
          {/* Status Header */}
          <div className="p-5 text-center relative"
            style={{ background: "linear-gradient(135deg, #003366 0%, #001e40 100%)" }}>
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20zm20-20h20v20H20V0z' fill='%23003366' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E\")",
              }}
            />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 bg-[#2e7d32] rounded-full flex items-center justify-center mb-3 shadow-xl">
                <span className="material-symbols-outlined text-3xl text-white"
                  style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <h2 className="font-headline font-black text-white text-xl tracking-tight uppercase">Validated</h2>
              <p className="text-on-primary-container font-medium text-xs mt-0.5">Transaction Authorized</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Resident Identity */}
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
              {displayFuelType && (
                <div
                  className="mx-auto w-full max-w-[240px] rounded-full border px-4 py-2 flex items-center justify-center gap-2 shadow-sm"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${fuelTypeTheme.bgFrom}, ${fuelTypeTheme.bgTo})`,
                    borderColor: fuelTypeTheme.border,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: fuelTypeTheme.text, fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
                  >
                    local_gas_station
                  </span>
                  <div className="text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wider leading-none" style={{ color: fuelTypeTheme.text }}>Fuel Type</p>
                    <p className="text-lg font-black leading-tight" style={{ color: fuelTypeTheme.text }}>{displayFuelType}</p>
                  </div>
                </div>
              )}
              {registeredAt && (
                <p className="text-outline text-[11px] text-center">Registered: {registeredAt}</p>
              )}
            </div>

            {/* Transaction Details */}
            <div className="space-y-4">
              <div
                className="rounded-2xl p-3 sm:p-4 border overflow-hidden"
                style={{ background: allocationBg, borderColor: allocationBorder }}
              >
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
                    const r = 22;
                    const circ = 2 * Math.PI * r;
                    const dash = (pct / 100) * circ;
                    return (
                      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                        <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90 absolute inset-0">
                          {/* Track */}
                          <circle cx="32" cy="32" r={r} fill="none" stroke={allocationBorder} strokeWidth="5" />
                          {/* Arc */}
                          <circle
                            cx="32" cy="32" r={r}
                            fill="none"
                            stroke={circleColor}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${dash} ${circ}`}
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
                    <span className="text-[8px] sm:text-[9px] font-black text-white whitespace-nowrap">{fuelConsumed}L used</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-end text-base sm:text-2xl font-bold" style={{ color: textColor }}>

                  <span className="text-right">Total: {fuelLimit} L / week</span>
                </div>
              </div>

              {/* Liter Input */}
              <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-3">
                <label className="text-outline text-[12px] font-bold uppercase tracking-wider">Input Liter</label>  
                <div className={`grid gap-2 ${isDieselType ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
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
                {remainingLiters <= 0 ? (
                  <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold px-4 py-3 text-center">
                    No allocation remaining — this resident has used their full weekly limit.
                  </div>
                ) : (
                  <>
                    <input
                      type="number"
                      min="0"
                      max={remainingLiters}
                      step="0.1"
                      value={literInput}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > remainingLiters) {
                          setLiterInput(String(remainingLiters));
                        } else {
                          setLiterInput(e.target.value);
                        }
                        setActionError("");
                      }}
                      placeholder={`Max ${remainingLiters.toFixed(1)} L`}
                      className="w-full rounded-lg border border-outline-variant/30 px-4 py-3 text-on-surface bg-white outline-none focus:border-[#003366]"
                    />
                    <div className="grid grid-cols-5 gap-2">
                      {[2, 5, 10, 15, 20].map((amount) => {
                        const exceeds = amount > remainingLiters;
                        return (
                          <button
                            key={amount}
                            type="button"
                            disabled={exceeds}
                            onClick={() => { setLiterInput(String(amount)); setActionError(""); }}
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
                  </>
                )}
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-tertiary-fixed/30 border-l-4 border-tertiary p-4 rounded-r-lg flex gap-3">
              <span className="material-symbols-outlined text-tertiary shrink-0">info</span>
              <p className="text-sm text-on-tertiary-fixed-variant leading-tight">
                Allocation is valid for immediate dispensing at the designated pump station.
                Please ensure fuel nozzle is securely attached.
              </p>
            </div>

            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm font-medium px-4 py-3 rounded-xl">
                {actionError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleConfirmDispense}
                disabled={remainingLiters <= 0 || !literInput || parseFloat(literInput) <= 0}
                className={`w-full font-headline font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                  remainingLiters > 0 && literInput && parseFloat(literInput) > 0
                    ? "bg-[#2e7d32] text-white active:scale-95 active:bg-[#1b5e20]"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span className="material-symbols-outlined">gas_meter</span>
                Confirm Dispense
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

      {/* Fuel Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <span className="material-symbols-outlined text-red-600"
                  style={{ fontSize: "32px", fontVariationSettings: "'FILL' 1" }}>
                  warning
                </span>
              </div>
              <h3 className="text-xl font-headline font-bold text-[#003366]">Fuel Limit Reached</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                This fuel request exceeds the allowed limit for this resident.
              </p>
              <div className="mt-4 w-full rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                <p><span className="font-semibold">Consumed:</span> {fuelConsumed}L</p>
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

