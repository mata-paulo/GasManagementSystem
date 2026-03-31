import { useState } from "react";
import BottomNav from "../components/BottomNav";
import { formatDecodedDate } from "../utils/qrCodec";

const RESIDENT_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAXqfapZS-XB6Ex6q9gvjpqo49kBnsKSV_xUi6169zZVPThLwv48yJSCJsg3D7IyBEQdesNhfzMVu4GbPrY-h_mMN48GNkjkDN94i2VLoNirV4gdVD9_vpFG_EUcvNBe-m9ofA0uEj-1fsv42-nOFkcpEpueA2XQdh55CDsc-3WQ3VKnvWCEa2TuKoYjPbW7Ul7uxELnVZ-rROGOE6PCdHq3b7944xXgic5uGrP2T2o2xLqLCfUhCZh_64W-e0uHD5DJ18JBsXhcMQY";

export default function ValidationSuccess({ officer, scannedResident, onBack, activeTab, onTabChange }) {
  const managerName = officer?.officerFirstName || officer?.firstName || "Manager";
  const brand = officer?.brand || "Station";

  const nameCode = scannedResident
    ? `${scannedResident.firstCode}... ${scannedResident.lastCode}...`
    : "Juan A. Dela Cruz";
  const registeredAt = scannedResident ? formatDecodedDate(scannedResident.date) : null;

  const [fuelConsumed, setFuelConsumed] = useState(12);
  const [fuelLimit] = useState(20);
  const [literInput, setLiterInput] = useState("");
  const [showLimitModal, setShowLimitModal] = useState(false);

  const handleAddLiters = () => {
    const liters = parseFloat(literInput);
    if (isNaN(liters) || liters <= 0) return;
    if (fuelConsumed + liters > fuelLimit) {
      setShowLimitModal(true);
      return;
    }
    setFuelConsumed((prev) => prev + liters);
    setLiterInput("");
  };

  return (
    <div className="flex flex-col min-h-dvh bg-surface relative">
      {/* Profile bar */}
      <div className="mx-4 mt-5 mb-2 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-outline-variant/20">
        <div className="w-11 h-11 rounded-full border-2 border-[#003366] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#003366]" style={{ fontSize: "24px" }}>
            manage_accounts
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-headline font-bold text-[#003366] text-base leading-tight truncate">{managerName}</p>
          <p className="text-xs text-slate-400 font-medium">Station Officer · {brand}</p>
        </div>
        <div className="shrink-0 flex flex-col items-center justify-center bg-[#003366] rounded-xl px-3 py-1.5 gap-0.5">
          <span className="material-symbols-outlined text-yellow-400"
            style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>
            local_gas_station
          </span>
          <span className="text-[9px] font-black text-white uppercase tracking-wider">Fuel Rationing</span>
        </div>
      </div>

      <main
        className="flex-1 pt-6 pb-36 px-4 max-w-md mx-auto w-full"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20zm20-20h20v20H20V0z' fill='%23003366' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E\")",
        }}
      >
        <div className="mt-4 bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
          {/* Status Header */}
          <div className="p-8 text-center relative"
            style={{ background: "linear-gradient(135deg, #003366 0%, #001e40 100%)" }}>
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20zm20-20h20v20H20V0z' fill='%23003366' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E\")",
              }}
            />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl">
                <span className="material-symbols-outlined text-5xl text-[#705d00]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <h2 className="font-headline font-black text-white text-2xl tracking-tight uppercase">Validated</h2>
              <p className="text-on-primary-container font-medium text-sm mt-1">Transaction Authorized</p>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Resident Identity */}
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full border-4 border-surface-container-high p-1 bg-white mb-4">
                <img src={RESIDENT_IMG} alt="Resident" className="w-full h-full rounded-full object-cover" />
              </div>
              <div className="space-y-1">
                <p className="text-outline text-xs font-bold tracking-widest uppercase">Verified Resident</p>
                <h3 className="font-headline font-extrabold text-2xl text-primary">{nameCode}</h3>
                {registeredAt && (
                  <p className="text-outline text-xs mt-1">Registered: {registeredAt}</p>
                )}
              </div>
            </div>

            {/* Decoded QR name codes */}
            {scannedResident && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-1">
                  <p className="text-outline text-[10px] font-bold uppercase tracking-wider">First Name Code</p>
                  <p className="font-headline font-black text-2xl text-[#003366] tracking-widest">{scannedResident.firstCode}</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-1">
                  <p className="text-outline text-[10px] font-bold uppercase tracking-wider">Last Name Code</p>
                  <p className="font-headline font-black text-2xl text-[#003366] tracking-widest">{scannedResident.lastCode}</p>
                </div>
              </div>
            )}

            {/* Transaction Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2">
                  <span className="material-symbols-outlined text-[#003366]">two_wheeler</span>
                  <div>
                    <p className="text-outline text-[12px] font-bold uppercase tracking-wider">Vehicle Type</p>
                    <p className="font-headline font-bold text-xl text-on-surface">Motorcycle</p>
                    <p className="text-outline text-[12px] font-bold uppercase tracking-wider mt-1">Plate Number</p>
                    <p className="font-headline font-bold text-xl text-on-surface">ABC-1234</p>
                  </div>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2">
                  <span className="material-symbols-outlined text-[#705d00]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    local_gas_station
                  </span>
                  <div>
                    <p className="text-outline text-[12px] font-bold uppercase tracking-wider">Fuel Consumed</p>
                    <p className="font-headline font-bold text-xl text-on-surface">{fuelConsumed}L</p>
                    <p className="text-outline text-[12px] font-bold uppercase tracking-wider mt-1">Fuel Limit</p>
                    <p className="font-headline font-bold text-xl text-on-surface">{fuelLimit}L</p>
                  </div>
                </div>
              </div>

              {/* QR Serial */}
              {scannedResident && (
                <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#003366]" style={{ fontSize: "18px" }}>qr_code</span>
                  <div>
                    <p className="text-outline text-[10px] font-bold uppercase tracking-wider">QR Serial</p>
                    <p className="font-headline font-bold text-sm text-on-surface font-mono tracking-widest">
                      {scannedResident.serial}
                    </p>
                  </div>
                </div>
              )}

              {/* Liter Input */}
              <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-3">
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
                <button
                  type="button"
                  onClick={handleAddLiters}
                  className="w-full bg-[#705d00] text-white font-headline font-bold py-3 rounded-xl active:scale-95 transition-all"
                >
                  Add Liters
                </button>
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
                onClick={onBack}
                className="w-full bg-[#003366] text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
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
