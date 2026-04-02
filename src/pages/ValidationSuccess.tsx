import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import { formatDecodedDate } from "../utils/qrCodec";

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

export default function ValidationSuccess({ officer, scannedResident, onBack, activeTab, onTabChange }: ValidationSuccessProps) {
  const managerName = officer?.officerFirstName || officer?.firstName || "Officer";
  const brand = officer?.brand || "Station";
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
  const [hasTopUp, setHasTopUp] = useState(false);
  const [actionError, setActionError] = useState("");
  const remainingLiters = Math.max(fuelLimit - fuelConsumed, 0);
  const fuelTypeLabel = "gasoline";
  const displayFuelType = "Gasoline";
  const isDieselType = fuelTypeLabel.includes("diesel");
  const fuelOptionButtons = isDieselType
    ? ["Diesel", "Premium Diesel"]
    : ["Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)"];
  const [selectedFuelOption, setSelectedFuelOption] = useState("");
  const fuelTypeTheme = fuelTypeLabel.includes("diesel")
    ? { bgFrom: "#dcfce7", bgTo: "#bbf7d0", border: "#86efac", text: "#166534" }
    : fuelTypeLabel.includes("premium")
      ? { bgFrom: "#ffedd5", bgTo: "#fed7aa", border: "#fdba74", text: "#9a3412" }
      : { bgFrom: "#fee2e2", bgTo: "#fecaca", border: "#fca5a5", text: "#991b1b" };
  const circleColor =
    remainingLiters <= 7
      ? "#c62828"
      : "#2e7d32";
  const allocationBg =
    remainingLiters <= 7
      ? "#fdecec"
      : "#eaf4ea";
  const allocationBorder =
    remainingLiters <= 7
      ? "#f4b9b9"
      : "#b8e3bf";
  const textColor = circleColor;
  const textMutedColor =
    remainingLiters <= 7
      ? "#9f1d1d"
      : "#1f5f27";

  const handleAddLiters = () => {
    const liters = parseFloat(literInput);
    if (isNaN(liters) || liters <= 0) return;
    if (fuelConsumed + liters > fuelLimit) {
      setShowLimitModal(true);
      return;
    }
    setFuelConsumed((prev) => prev + liters);
    setLiterInput("");
    setHasTopUp(true);
    setActionError("");
  };

  const handleConfirmDispense = () => {
    if (!hasTopUp) {
      setActionError("Please top up liters first before confirming dispense.");
      return;
    }
    onBack();
  };

  useEffect(() => {
    setSelectedFuelOption(fuelOptionButtons[0] || "");
  }, [fuelTypeLabel]);

  return (
    <div className="flex flex-col min-h-dvh bg-surface relative">
      {/* Profile bar */}
      <div className="mx-4 mt-5 mb-2 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-outline-variant/20">
        <div className="w-11 h-11 rounded-full border-2 border-[#003366] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#003366] icon-lg">
            manage_accounts
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-headline font-bold text-[#003366] text-base leading-tight truncate">{managerName}</p>
          <p className="text-xs text-slate-400 font-medium">Station Officer · {brand}</p>
        </div>
        <div className="shrink-0 flex flex-col items-center justify-center bg-[#003366] rounded-xl px-3 py-1.5 gap-0.5">
          <span className="material-symbols-outlined text-yellow-400 icon-filled icon-base">
            local_gas_station
          </span>
          <span className="text-[9px] font-black text-white uppercase tracking-wider">Fuel Rationing</span>
        </div>
      </div>

      <main className="flex-1 pt-6 pb-36 px-4 max-w-md mx-auto w-full checkerboard-pattern">
        <div className="mt-4 bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
          {/* Status Header */}
          <div className="p-8 text-center relative header-gradient">
            <div className="absolute inset-0 opacity-10 checkerboard-overlay" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl">
                <span className="material-symbols-outlined text-5xl text-[#705d00] icon-filled">
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
                        {remainingLiters.toFixed(1)}
                      </p>
                      <span className="text-xl sm:text-3xl" style={{ color: textColor }}>Liters</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold mt-1" style={{ color: textColor }}>Remaining</p>
                  </div>
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3px] sm:border-4 bg-white flex flex-col items-center justify-center shrink-0"
                    style={{ borderColor: circleColor }}
                  >
                    <span
                      className="text-xl sm:text-3xl font-black leading-none"
                      style={{ color: circleColor }}
                    >
                      {Math.round((remainingLiters / fuelLimit) * 100)}%
                    </span>
                    <span
                      className="text-[8px] sm:text-[9px] font-bold uppercase"
                      style={{ color: circleColor }}
                    >
                      Left
                    </span>
                  </div>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2">
                  <span className="material-symbols-outlined text-[#705d00] icon-filled">
                    local_gas_station
                  </span>
                  <div>
                    <p className="text-outline text-[12px] font-bold uppercase tracking-wider">Fuel Consumed</p>
                    <p className="font-headline font-bold text-xl text-on-surface">{fuelConsumed}L</p>
                    <p className="text-outline text-[12px] font-bold uppercase tracking-wider mt-1">Fuel Limit</p>
                    <p className="font-headline font-bold text-xl text-on-surface">{fuelLimit}L</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-end text-base sm:text-2xl font-bold" style={{ color: textColor }}>

              {/* Fuel Type + QR Serial */}
              {scannedResident && (
                <div className="grid grid-cols-2 gap-3">
                  {scannedResident.gasType && (
                    <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-1">
                      <span className="material-symbols-outlined text-[#705d00] icon-filled icon-base">local_gas_station</span>
                      <p className="text-outline text-[10px] font-bold uppercase tracking-wider">Fuel Type</p>
                      <p className="font-headline font-bold text-sm text-on-surface">{scannedResident.gasType}</p>
                    </div>
                  )}
                  <div className={`bg-surface-container-low p-4 rounded-xl flex flex-col gap-1 ${!scannedResident.gasType ? "col-span-2" : ""}`}>
                    <span className="material-symbols-outlined text-[#003366] icon-base">qr_code</span>
                    <p className="text-outline text-[10px] font-bold uppercase tracking-wider">QR Serial</p>
                    <p className="font-headline font-bold text-sm text-on-surface font-mono tracking-widest">{scannedResident.serial}</p>
                  </div>
                </div>
              )}
                </div>
              </div>

              {/* Liter Input */}
              <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-3">
                <label className="text-outline text-[12px] font-bold uppercase tracking-wider">Fuel Type</label>  
                <div className={`grid gap-2 ${isDieselType ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3"}`}>
                  {fuelOptionButtons.map((option) => {
                    const active = selectedFuelOption === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSelectedFuelOption(option)}
                        className={`rounded-lg border py-2.5 px-2 text-sm sm:text-base font-bold active:scale-95 transition-all ${
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
                <label className="text-outline text-[12px] font-bold uppercase tracking-wider">Input Liter</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={literInput}
                  onChange={(e) => setLiterInput(e.target.value)}
                  placeholder="Enter liters"
                  className="w-full rounded-lg border border-outline-variant/30 px-4 py-3 text-on-surface bg-white outline-none focus:border-[#003366]"
                />
                <div className="grid grid-cols-5 gap-2">
                  {[2, 5, 10, 15, 20].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setLiterInput(String(amount))}
                      className="rounded-lg border border-outline-variant/40 bg-white py-2.5 text-sm font-bold text-[#003366] active:scale-95 transition-all hover:bg-slate-50"
                    >
                      {amount} L
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddLiters}
                  className="w-full bg-[#003366] text-white font-headline font-bold py-3 rounded-xl active:scale-95 transition-all"
                >
                  Top Up
                </button>
                {actionError && (
                  <div className="flex items-center gap-2 bg-error-container text-on-error-container px-3 py-2 rounded-lg text-sm">
                    <span className="material-symbols-outlined text-base">error</span>
                    {actionError}
                  </div>
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

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmDispense}
                className="w-full bg-[#2e7d32] text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">gas_meter</span>
                Confirm Dispense
              </button>
              <button
                type="button"
                onClick={onBack}
                className="w-full bg-surface-container-high text-on-surface-variant font-headline font-bold py-4 rounded-xl active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-outline text-xs space-y-1 pb-4">
          <p>© 2024 Mata Technologies Inc.</p>
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
                <span className="material-symbols-outlined text-red-600 icon-filled text-[32px]">
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
