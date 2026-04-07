import React, { useState, useMemo } from "react";
import { FirebaseError } from "firebase/app";
import { isContainerType, isGeneratorType } from "@/lib/utils/vehicleValidation";
import { signInWithEmailAndPassword } from "firebase/auth";
import type { AuthUser } from "@/lib/auth/authService";
import { auth } from "@/lib/firebase/client";

function httpErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Registration failed. Please try again.";
}

function envValue(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = import.meta.env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

const DEFAULT_DEV_FIREBASE_PROJECT_ID = "agas-fuel-rationing-system";

function getRegisterResidentUrl(): string {
  const explicitUrl = envValue("VITE_REGISTER_RESIDENT_URL", "VITE_PUBLIC_REGISTER_RESIDENT_URL");
  if (explicitUrl) return explicitUrl;

  const useEmu = envValue("VITE_USE_FIREBASE_EMULATORS", "VITE_PUBLIC_USE_EMULATOR") === "true";
  const projectId =
    envValue("VITE_FIREBASE_PROJECT_ID", "VITE_PUBLIC_FIREBASE_PROJECT_ID") ||
    (import.meta.env.DEV && useEmu ? DEFAULT_DEV_FIREBASE_PROJECT_ID : undefined);
  const region =
    envValue("VITE_FIREBASE_FUNCTIONS_REGION", "VITE_PUBLIC_FIREBASE_FUNCTIONS_REGION") ?? "asia-southeast1";

  if (import.meta.env.DEV && useEmu && projectId)
    return `http://127.0.0.1:5001/${projectId}/${region}/registerResident`;
  if (import.meta.env.DEV && projectId)
    return `https://${region}-${projectId}.cloudfunctions.net/registerResident`;
  return "/api/registerResident";
}

async function registerResidentHttp(payload: Record<string, unknown>): Promise<{ uid?: string }> {
  const res = await fetch(getRegisterResidentUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json().catch(() => ({}))) as { uid?: string } | { error?: { message?: string } };
  if (!res.ok) {
    const message =
      (typeof json === "object" && json && "error" in json &&
        (json as { error?: { message?: string } }).error?.message) || "Registration failed.";
    throw new Error(message);
  }
  return json as { uid?: string };
}

const CEBU_BARANGAYS = [
  "Adlaon","Agsungot","Apas","Babag","Bacayan","Banilad","Basak Pardo","Basak San Nicolas",
  "Binaliw","Budlaan","Buhisan","Bulacao","Buot-Taup Pardo","Busay","Calamba","Cambinocot",
  "Camputhaw","Capitol Site","Carreta","Central Poblacion","Cogon Pardo","Cogon Ramos",
  "Day-as","Duljo","Ermita","Guadalupe","Guba","Hipodromo","Inayawan","Kalubihan",
  "Kalunasan","Kamagayan","Kasambagan","Kinasang-an Pardo","Labangon","Lahug",
  "Lorega San Miguel","Lusaran","Luz","Mabini","Mabolo","Malubog","Manipis","Nasipit",
  "Nga-an","Nivel Hills","Non-oc","Pari-an","Pasil","Pit-os","Poblacion Pardo","Pulangbato",
  "Pung-ol Sibugay","Punta Princesa","Quiot Pardo","Ramos","San Antonio","San Jose",
  "San Nicolas Proper","San Roque","Santa Cruz","Santa Lucia","Santo Niño","Sapangdaku",
  "Sawang Calero","Sinsin","Sirao","Sudlon I","Sudlon II","T. Padilla","Tabunan","Tagbao",
  "Talamban","Taptap","Tejero","Tinago","Tisa","To-ong Pardo","Tugbongan","Zapatera",
];

const GAS_TYPES = [
  { id: "Diesel",   label: "Diesel",   icon: "oil_barrel",       activeClass: "bg-emerald-700 border-emerald-700 text-white shadow-lg",  inactiveClass: "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-emerald-600/40" },
  { id: "Gasoline", label: "Gasoline", icon: "local_gas_station", activeClass: "bg-red-600 border-red-600 text-white shadow-lg",          inactiveClass: "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-red-400/40" },
];

const VEHICLE_TYPES = [
  { id: "2w",     label: "2 Wheelers", icon: "two_wheeler"    },
  { id: "4w",     label: "4 Wheelers", icon: "directions_car" },
  { id: "others", label: "Others",     icon: "commute"        },
];

// ── Barangay Picker ───────────────────────────────────────────────────────────
function BarangayPicker({ value, onChange }: { value: string; onChange: (b: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? CEBU_BARANGAYS.filter((b) => b.toLowerCase().includes(q)) : CEBU_BARANGAYS;
  }, [search]);

  const close = () => { setOpen(false); setSearch(""); };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-12 pr-10 text-sm text-left relative focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">location_on</span>
        <span className={value ? "text-on-surface" : "text-outline"}>{value || "Select your barangay…"}</span>
        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">expand_more</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="relative w-full lg:max-w-md bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl flex flex-col max-h-[75vh]">
            <div className="flex justify-center pt-3 pb-1 shrink-0 lg:hidden"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
            <div className="px-4 pb-3 pt-2 shrink-0 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#003366] text-base">Select Barangay</h3>
                <button type="button" onClick={close} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">search</span>
                <input type="text" placeholder="Search barangay..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus
                  className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <span className="material-symbols-outlined text-base">cancel</span>
                  </button>
                )}
              </div>
              {filtered.length > 0 && <p className="text-xs text-gray-400 mt-1.5 ml-1">{filtered.length} barangays</p>}
            </div>
            <div className="overflow-y-auto flex-1 px-2 py-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">location_off</span>
                  <p className="text-sm">No barangay found</p>
                </div>
              ) : filtered.map((b) => {
                const sel = value === b;
                return (
                  <button key={b} type="button" onClick={() => { onChange(b); close(); }}
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between text-sm transition-colors active:scale-[0.98] ${sel ? "bg-blue-50 text-[#003366] font-semibold" : "text-gray-800 hover:bg-gray-50"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-base ${sel ? "text-[#003366]" : "text-gray-300"}`}>location_on</span>
                      {b}
                    </div>
                    {sel && <span className="material-symbols-outlined text-[#003366] text-base">check_circle</span>}
                  </button>
                );
              })}
            </div>
            <div className="shrink-0 pb-4" />
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Register Component ───────────────────────────────────────────────────
export default function Register({ onBack, onSuccess, onSignIn }: { onBack: () => void; onSuccess: (data: Record<string, unknown>) => void; onSignIn?: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const MAX_VEHICLES = 5;
  const [vehicles, setVehicles] = useState([{ type: "4w", plate: "", gasType: "" }]);
  const updateVehicle = (i: number, field: string, value: string) =>
    setVehicles((prev) => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v));
  const addVehicle = () => setVehicles((prev) => [...prev, { type: "4w", plate: "", gasType: "" }]);
  const removeVehicle = (i: number) => setVehicles((prev) => prev.filter((_, idx) => idx !== i));

  const [form, setForm] = useState({ lastName: "", firstName: "", barangay: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [registering, setRegistering] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const validateStep1 = () => {
    const { firstName, lastName, barangay, email, password, confirmPassword } = form;
    if (!firstName.trim() || !lastName.trim() || !barangay || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("All fields are required."); return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address."); return false;
    }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return false; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return false; }
    return true;
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) { setError(""); setStep(2); }
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    for (const v of vehicles) {
      if (!["2w", "4w"].includes(v.type) && isContainerType(v.type)) { setError("Container-type vehicles are not allowed in the AGAS program."); return; }
      if (!v.plate.trim()) { setError(isGeneratorType(v.type) ? "Please fill in the serial number for your generator." : "Please fill in all plate numbers."); return; }
      if (!v.gasType) { setError("Please select a fuel type for each vehicle."); return; }
    }
    if (!agreedToTerms) { setError("You must agree to the Terms and Conditions to register."); return; }
    setError("");
    setConfirmError("");
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setConfirmError("");
    setRegistering(true);
    const email = form.email.trim().toLowerCase();
    try {
      const mappedVehicles = vehicles.map((v) => ({ ...v, plate: v.plate.trim().toUpperCase() }));
      const payload: Record<string, unknown> = {
        vehicleType: mappedVehicles[0].type,
        plate: mappedVehicles[0].plate,
        gasType: mappedVehicles[0].gasType,
        vehicles: mappedVehicles,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        barangay: form.barangay,
        email,
        password: form.password,
      };
      const data = await registerResidentHttp(payload);
      const cred = await signInWithEmailAndPassword(auth, email, form.password);
      const authUser: AuthUser = {
        email, role: "resident", loginAt: new Date().toISOString(),
        firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        plate: mappedVehicles[0].plate, barangay: form.barangay,
        vehicleType: mappedVehicles[0].type, gasType: mappedVehicles[0].gasType,
        vehicles: mappedVehicles, registeredAt: new Date().toISOString(),
        uid: data.uid ?? cred.user.uid,
        ...(mappedVehicles.length > 1 && {
          vehicle2Type: mappedVehicles[1].type,
          vehicle2Plate: mappedVehicles[1].plate,
          vehicle2GasType: mappedVehicles[1].gasType,
        }),
      };
      setShowConfirm(false);
      onSuccess({ ...authUser });
    } catch (err) {
      if (err instanceof FirebaseError) setConfirmError(err.message || "Registration failed.");
      else setConfirmError(httpErrorMessage(err));
    } finally {
      setRegistering(false);
    }
  };

  const handleBack = () => {
    setError("");
    if (step === 2) setStep(1);
    else onBack();
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inputCls = "w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all";
  const labelCls = "text-xs font-bold text-on-surface-variant uppercase tracking-wider";

  // ── Step tabs ─────────────────────────────────────────────────────────────
  const StepTabs = ({ dark = false }: { dark?: boolean }) => (
    <div className={`mb-5 relative grid grid-cols-2 gap-2 rounded-xl p-1 overflow-hidden ${dark ? "bg-white/10" : "bg-surface-container-low"}`}>
      <div className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-lg shadow-sm transition-transform duration-300 ease-out ${step === 1 ? "translate-x-0" : "translate-x-[calc(100%+0.5rem)]"} ${dark ? "bg-white" : "bg-[#003366]"}`} />
      <button type="button" onClick={() => { setError(""); setStep(1); }}
        className={`relative z-10 rounded-lg py-2 text-xs font-bold transition-colors duration-300 ${step === 1 ? (dark ? "text-[#003366]" : "text-white") : (dark ? "text-white/60" : "text-slate-500")}`}>
        1. Personal Info
      </button>
      <button type="button" onClick={() => { if (validateStep1()) { setError(""); setStep(2); } }}
        className={`relative z-10 rounded-lg py-2 text-xs font-bold transition-colors duration-300 ${step === 2 ? (dark ? "text-[#003366]" : "text-white") : (dark ? "text-white/60" : "text-slate-500")}`}>
        2. Vehicle Details
      </button>
    </div>
  );

  // ── Step 1 fields (shared) ────────────────────────────────────────────────
  const StepOneFields = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className={labelCls}>Representative Name</label>
        <div className="grid grid-cols-2 gap-3">
          <input type="text" name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" className={inputCls} />
          <input type="text" name="lastName"  value={form.lastName}  onChange={handleChange} placeholder="Last name"  className={inputCls} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className={labelCls}>Barangay</label>
        <BarangayPicker value={form.barangay} onChange={(b) => { setForm((p) => ({ ...p, barangay: b })); setError(""); }} />
      </div>
      <div className="space-y-1.5">
        <label className={labelCls}>Email</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">mail</span>
          <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="e.g. juan@email.com"
            className={`${inputCls} pl-12`} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={labelCls}>Password</label>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters"
              className={`${inputCls} pr-12`} />
            <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
              <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Confirm Password</label>
          <div className="relative">
            <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password"
              className={`${inputCls} pr-12`} />
            <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
              <span className="material-symbols-outlined text-xl">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 2 fields (shared) ────────────────────────────────────────────────
  const StepTwoFields = (
    <div className="space-y-4">
      {vehicles.map((v, i) => (
        <div key={i} className={i > 0 ? "border border-outline-variant rounded-2xl p-4 space-y-4 bg-slate-50/50" : "space-y-4"}>
          {i > 0 && (
            <div className="flex items-center justify-between">
              <p className={labelCls}>Vehicle {i + 1}</p>
              <button type="button" onClick={() => { removeVehicle(i); setError(""); }}
                className="text-xs text-red-500 font-semibold flex items-center gap-1 hover:text-red-700 transition-colors">
                <span className="material-symbols-outlined text-[15px]">remove_circle</span>Remove
              </button>
            </div>
          )}
          <div className="space-y-1.5">
            <label className={labelCls}>Vehicle Type</label>
            <div className="grid grid-cols-3 gap-3">
              {VEHICLE_TYPES.map((vt) => {
                const isOthers = !["2w", "4w"].includes(v.type);
                const active = vt.id === "others" ? isOthers : v.type === vt.id;
                return (
                  <button key={vt.id} type="button"
                    onClick={() => updateVehicle(i, "type", vt.id === "others" ? "" : vt.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border-2 font-headline font-bold text-sm transition-all active:scale-95 ${active ? "bg-primary-container border-primary-container text-white shadow-lg" : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-primary-container/40"}`}>
                    <span className={`material-symbols-outlined text-[28px] ${active ? "icon-fill" : ""}`}>{vt.icon}</span>
                    {vt.label}
                  </button>
                );
              })}
            </div>
            {!["2w", "4w"].includes(v.type) && (
              <div className="space-y-1.5 mt-2">
                <input type="text" value={v.type} onChange={(e) => updateVehicle(i, "type", e.target.value)}
                  placeholder="e.g. Tricycle, Truck, Jeepney..."
                  className={`${inputCls} ${isContainerType(v.type) ? "!border-error focus:!border-error focus:!ring-error/20" : ""}`} />
                {isContainerType(v.type) && (
                  <div className="flex items-start gap-2 bg-error-container/30 border border-error/30 text-error px-3 py-2 rounded-xl text-xs">
                    <span className="material-symbols-outlined text-base shrink-0 mt-0.5">block</span>
                    <span>Container-type vehicles are not allowed in the AGAS program.</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>{isGeneratorType(v.type) ? "Serial No." : "Plate No."}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">
                {v.type === "2w" ? "two_wheeler" : v.type === "4w" ? "directions_car" : "commute"}
              </span>
              <input type="text" value={v.plate}
                onChange={(e) => { updateVehicle(i, "plate", e.target.value.toUpperCase()); setError(""); }}
                placeholder={isGeneratorType(v.type) ? "e.g. GEN-2024-001" : "e.g. ABC-1234"} maxLength={10}
                className={`${inputCls} pl-12 uppercase tracking-widest font-bold`} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Fuel Type</label>
            <div className="grid grid-cols-2 gap-3">
              {GAS_TYPES.map((g) => {
                const active = v.gasType === g.id;
                return (
                  <button key={g.id} type="button" onClick={() => { updateVehicle(i, "gasType", g.id); setError(""); }}
                    className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border-2 font-headline font-bold text-sm transition-all active:scale-95 ${active ? g.activeClass : g.inactiveClass}`}>
                    <span className={`material-symbols-outlined text-[28px] ${active ? "icon-fill" : ""}`}>{g.icon}</span>
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {vehicles.length < MAX_VEHICLES && (
        <button type="button" onClick={addVehicle}
          className="w-full border-2 border-dashed border-outline-variant text-on-surface-variant font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm hover:border-primary-container/50 hover:text-primary-container transition-all active:scale-95">
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Add Vehicle
        </button>
      )}

      <div className="bg-surface-container-low border-l-4 border-primary-container p-3 rounded-r-lg flex gap-3 text-xs text-on-surface-variant">
        <span className="material-symbols-outlined text-primary-container text-base shrink-0">info</span>
        Your QR code will be available to view after registration is complete.
      </div>

      <label className="flex items-start gap-3 cursor-pointer select-none">
        <div className="relative shrink-0 mt-0.5">
          <input type="checkbox" checked={agreedToTerms} onChange={(e) => { setAgreedToTerms(e.target.checked); setError(""); }} className="sr-only" />
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${agreedToTerms ? "bg-[#003366] border-[#003366]" : "bg-white border-slate-300"}`}>
            {agreedToTerms && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
          </div>
        </div>
        <span className="text-xs text-on-surface-variant leading-relaxed">
          I have read and agree to the <span className="font-semibold text-[#003366]">Terms and Conditions</span> and{" "}
          <span className="font-semibold text-[#003366]">Privacy Policy</span> of the AGAS Gas Allocation System.
        </span>
      </label>
    </div>
  );

  // ── Confirm modal ─────────────────────────────────────────────────────────
  const ConfirmModal = showConfirm ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-[#003366] px-5 py-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-yellow-300 icon-fill text-[24px]">help</span>
          <div>
            <p className="text-white font-headline font-black text-sm leading-none">Confirm Registration</p>
            <p className="text-white/60 text-[10px] mt-0.5">Please review your information before submitting</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex flex-col items-center bg-[#1a4f8a] rounded-xl py-3 px-6">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Plate Number</p>
            <p className="font-headline font-black text-white text-2xl tracking-[0.2em] uppercase">{vehicles[0]?.plate || "—"}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400 text-xs">Name</span><span className="font-bold text-[#003366] text-xs">{form.firstName} {form.lastName}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 text-xs">Email</span><span className="font-bold text-[#003366] text-xs truncate max-w-[180px]">{form.email}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 text-xs">Barangay</span><span className="font-bold text-[#003366] text-xs">{form.barangay}</span></div>
            {vehicles.map((v, i) => (
              <React.Fragment key={i}>
                <div className="h-px bg-slate-200 my-1" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle {i + 1}</p>
                <div className="flex justify-between"><span className="text-slate-400 text-xs">Type</span><span className="font-bold text-[#003366] text-xs capitalize">{v.type}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 text-xs">Plate</span><span className="font-bold text-[#003366] text-xs">{v.plate.toUpperCase()}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 text-xs">Fuel</span><span className="font-bold text-[#003366] text-xs">{v.gasType}</span></div>
              </React.Fragment>
            ))}
          </div>
        </div>
        {confirmError && (
          <div className="flex items-center gap-2 bg-error-container text-on-error-container px-5 py-3 text-sm">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            {confirmError}
          </div>
        )}
        <div className="flex gap-3 px-5 pb-5">
          <button type="button" disabled={registering} onClick={() => setShowConfirm(false)}
            className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl text-sm active:scale-95 transition-all disabled:opacity-50">
            Go Back
          </button>
          <button type="button" disabled={registering} onClick={() => void handleConfirm()}
            className="flex-1 bg-[#003366] text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {registering
              ? <><span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>Registering…</>
              : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {ConfirmModal}

      {/* ── Mobile layout ──────────────────────────────────────────────────── */}
      <div className="flex flex-col min-h-dvh bg-background lg:hidden">
        <div className="relative flex items-center justify-center px-6 py-4 bg-slate-100/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
          <button type="button" onClick={handleBack} aria-label="Go back"
            className="absolute left-4 p-2 hover:bg-slate-200/50 rounded-full transition-all active:scale-95 text-[#003366]">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="text-center">
            <h1 className="text-[#003366] font-headline font-bold text-lg leading-none">AGAS Portal</h1>
            <p className="text-[10px] text-[#003366] font-black uppercase tracking-wider opacity-70">Registration</p>
          </div>
        </div>

        <main className="flex-1 px-6 pt-8 pb-12 max-w-md mx-auto w-full">
          <div className="mb-6">
            <h2 className="font-headline font-extrabold text-primary text-2xl">Register Account</h2>
            <p className="text-on-surface-variant text-sm mt-1">Fill in your personal and vehicle details.</p>
          </div>

          <StepTabs />

          <form onSubmit={step === 1 ? handleStep1 : handleStep2} className="space-y-4">
            {step === 1 && StepOneFields}
            {step === 2 && StepTwoFields}

            {error && (
              <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                {error}
              </div>
            )}

            {step === 1 ? (
              <button type="submit"
                className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">
                Next
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => { setError(""); setStep(1); }}
                  className="w-full border border-outline-variant text-on-surface font-headline font-bold py-4 rounded-xl active:scale-95 transition-all">
                  Back
                </button>
                <button type="submit"
                  className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined icon-fill">how_to_reg</span>Register
                </button>
              </div>
            )}
          </form>

          {onSignIn && (
            <p className="text-center text-xs text-on-surface-variant mt-5">
              Already have an account?{" "}
              <button type="button" onClick={onSignIn} className="font-bold text-[#003366] underline underline-offset-2 active:opacity-70">
                Sign In
              </button>
            </p>
          )}
        </main>
      </div>

      {/* ── Desktop layout ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex min-h-dvh">

        {/* Left branding panel */}
        <div className="w-[420px] shrink-0 bg-gradient-to-br from-[#001228] via-[#001e40] to-[#003366] flex flex-col px-10 py-10 relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/[0.03] pointer-events-none" />
          <div className="absolute bottom-10 -right-16 w-72 h-72 rounded-full bg-white/[0.04] pointer-events-none" />

          <button type="button" onClick={handleBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium group w-fit">
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            Back
          </button>

          <div className="mt-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#001e40] icon-fill text-[22px]">local_gas_station</span>
            </div>
            <div>
              <p className="text-white font-black text-base tracking-widest uppercase leading-none">A.G.A.S</p>
              <p className="text-white/40 text-[10px] tracking-wider uppercase mt-0.5">Fuel Rationing System</p>
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <h1 className="text-white font-headline font-black text-4xl leading-tight">Register<br />Your Account</h1>
            <p className="text-white/50 text-sm leading-relaxed">
              Join the AGAS program and get your fair fuel allocation for your vehicle.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {[
              { num: 1, label: "Personal Information", desc: "Name, barangay & credentials" },
              { num: 2, label: "Vehicle Details",      desc: "Vehicle type, plate & fuel"   },
            ].map((s) => {
              const active = step === s.num;
              const done   = step > s.num;
              return (
                <div key={s.num} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black border-2 transition-all ${
                    done   ? "bg-yellow-400 border-yellow-400 text-[#001e40]" :
                    active ? "bg-white border-white text-[#003366]" :
                             "bg-transparent border-white/30 text-white/30"
                  }`}>
                    {done ? <span className="material-symbols-outlined text-[14px]">check</span> : s.num}
                  </div>
                  <div className="pt-0.5">
                    <p className={`text-sm font-bold leading-none ${active || done ? "text-white" : "text-white/30"}`}>{s.label}</p>
                    <p className={`text-xs mt-0.5 ${active ? "text-white/60" : "text-white/25"}`}>{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-8">
            <p className="text-white/20 text-[10px] uppercase tracking-widest">© 2026 Mata Technologies Inc.</p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 bg-slate-50 flex items-start justify-center overflow-y-auto py-12 px-8">
          <div className="w-full max-w-2xl">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

              {/* Card header */}
              <div className="bg-gradient-to-r from-[#001e40] to-[#003366] px-8 py-6">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Registration</p>
                <h2 className="text-white font-headline font-black text-2xl">
                  {step === 1 ? "Personal Information" : "Vehicle Details"}
                </h2>
                <p className="text-white/50 text-sm mt-1">
                  {step === 1 ? "Enter your name, barangay, and account credentials." : "Add your vehicle and fuel type information."}
                </p>
              </div>

              <div className="px-8 py-6">
                <StepTabs />

                <form onSubmit={step === 1 ? handleStep1 : handleStep2} className="space-y-5">
                  {step === 1 && StepOneFields}
                  {step === 2 && StepTwoFields}

                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                      <span className="material-symbols-outlined text-base shrink-0">error</span>
                      {error}
                    </div>
                  )}

                  {step === 1 ? (
                    <button type="submit"
                      className="w-full bg-[#003366] text-white font-headline font-bold py-4 rounded-xl shadow-lg hover:bg-[#002244] active:scale-[0.98] transition-all">
                      Next — Vehicle Details
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setError(""); setStep(1); }}
                        className="flex-1 border-2 border-slate-200 text-slate-600 font-headline font-bold py-4 rounded-xl hover:border-slate-300 active:scale-[0.98] transition-all">
                        Back
                      </button>
                      <button type="submit"
                        className="flex-[2] bg-[#003366] text-white font-headline font-bold py-4 rounded-xl shadow-lg hover:bg-[#002244] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined icon-fill text-[18px]">how_to_reg</span>
                        Create Your Account
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {onSignIn && (
              <p className="text-center text-slate-400 text-xs mt-4">
                Already have an account?{" "}
                <button type="button" onClick={onSignIn} className="font-semibold text-[#003366] hover:underline">
                  Sign In
                </button>
              </p>
            )}
            <p className="text-center text-slate-400 text-xs mt-2">© 2026 Mata Technologies Inc. · A.G.A.S</p>
          </div>
        </div>
      </div>
    </>
  );
}
