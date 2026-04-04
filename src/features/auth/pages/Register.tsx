import React, { useState, useMemo } from "react";
import { FirebaseError } from "firebase/app";
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

/** Matches `.firebaserc` default; used in dev when emulators are on but `VITE_FIREBASE_PROJECT_ID` is missing (e.g. env file not named `.env`). */
const DEFAULT_DEV_FIREBASE_PROJECT_ID = "agas-fuel-rationing-system";

function getRegisterResidentUrl(): string {
  const explicitUrl = envValue(
    "VITE_REGISTER_RESIDENT_URL",
    "VITE_PUBLIC_REGISTER_RESIDENT_URL",
  );
  if (explicitUrl) {
    return explicitUrl;
  }

  const useEmu =
    envValue("VITE_USE_FIREBASE_EMULATORS", "VITE_PUBLIC_USE_EMULATOR") === "true";

  const projectId =
    envValue("VITE_FIREBASE_PROJECT_ID", "VITE_PUBLIC_FIREBASE_PROJECT_ID") ||
    (import.meta.env.DEV && useEmu ? DEFAULT_DEV_FIREBASE_PROJECT_ID : undefined);

  const region =
    envValue(
      "VITE_FIREBASE_FUNCTIONS_REGION",
      "VITE_PUBLIC_FIREBASE_FUNCTIONS_REGION",
    ) ?? "asia-southeast1";

  if (import.meta.env.DEV && useEmu && projectId) {
    return `http://127.0.0.1:5001/${projectId}/${region}/registerResident`;
  }

  if (import.meta.env.DEV && projectId) {
    return `https://${region}-${projectId}.cloudfunctions.net/registerResident`;
  }

  // Production build: same-origin on Firebase Hosting (rewrite → function). Local Vite: proxied to emulator (see vite.config.ts).
  return "/api/registerResident";
}

async function registerResidentHttp(payload: Record<string, unknown>): Promise<{ uid?: string }> {
  const res = await fetch(getRegisterResidentUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = (await res.json().catch(() => ({}))) as
    | { uid?: string }
    | { error?: { message?: string } };

  if (!res.ok) {
    const message =
      (typeof json === "object" &&
        json &&
        "error" in json &&
        (json as { error?: { message?: string } }).error?.message) ||
      "Registration failed.";
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
  { id: "Diesel",   label: "Diesel",   icon: "oil_barrel",        activeClass: "bg-emerald-700 border-emerald-700 text-white shadow-lg",   inactiveClass: "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-emerald-600/40" },
  { id: "Gasoline", label: "Gasoline", icon: "local_gas_station",  activeClass: "bg-red-600 border-red-600 text-white shadow-lg",           inactiveClass: "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-red-400/40" },
];

const VEHICLE_TYPES = [
  { id: "car",        label: "Car",        icon: "directions_car" },
  { id: "truck",      label: "Truck",      icon: "local_shipping" },
  { id: "motorcycle", label: "Motorcycle", icon: "two_wheeler" },
];

// ── Gas Type Picker ──────────────────────────────────────────────────────────
function GasTypePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {GAS_TYPES.map((g) => {
        const active = value === g.id;
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onChange(g.id)}
            className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border-2 font-headline font-bold text-sm transition-all active:scale-95 ${
              active ? g.activeClass : g.inactiveClass
            }`}
          >
            <span className={`material-symbols-outlined text-[28px] ${active ? "icon-fill" : ""}`}>
              {g.icon}
            </span>
            {g.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Barangay Picker ──────────────────────────────────────────────────────────
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
        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-12 pr-10 text-sm text-left relative focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">location_on</span>
        <span className={value ? "text-on-surface" : "text-outline"}>{value || "Select your barangay…"}</span>
        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">expand_more</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="relative w-full bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[75vh]">
            <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
            <div className="px-4 pb-3 shrink-0 border-b border-gray-100">
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

// ── Main Register Component ──────────────────────────────────────────────────
export default function Register({ onBack, onSuccess }: { onBack: () => void; onSuccess: (data: Record<string, unknown>) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [vehicleType, setVehicleType] = useState("car");
  const [gasType, setGasType] = useState("");
  const [form, setForm] = useState({
    plate: "",
    lastName: "",
    firstName: "",
    barangay: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
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

  // ── Step 1: validate personal info then advance ──
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    const { firstName, lastName, barangay, email, password, confirmPassword } = form;
    if (!firstName.trim() || !lastName.trim() || !barangay || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("All fields are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setStep(2);
  };

  // ── Step 2: validate vehicle info then show confirm dialog ──
  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plate.trim() || !gasType) {
      setError("Please fill in plate number and fuel type.");
      return;
    }
    if (!agreedToTerms) {
      setError("You must agree to the Terms and Conditions to register.");
      return;
    }
    setError("");
    setConfirmError("");
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setConfirmError("");
    setRegistering(true);
    const email = form.email.trim().toLowerCase();
    const plate = form.plate.trim().toUpperCase();
    try {
      const data = await registerResidentHttp({
        vehicleType,
        plate,
        gasType,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        barangay: form.barangay,
        email,
        password: form.password,
      });
      const cred = await signInWithEmailAndPassword(auth, email, form.password);

      const authUser: AuthUser = {
        email,
        role: "resident",
        loginAt: new Date().toISOString(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        plate,
        barangay: form.barangay,
        vehicleType,
        gasType,
        registeredAt: new Date().toISOString(),
        uid: data.uid ?? cred.user.uid,
      };
      setShowConfirm(false);
      onSuccess({ ...authUser });
    } catch (err) {
      // Keep FirebaseError handling for the immediate sign-in step.
      if (err instanceof FirebaseError) {
        setConfirmError(err.message || "Registration failed.");
      } else {
        setConfirmError(httpErrorMessage(err));
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleBack = () => {
    setError("");
    if (step === 2) {
      setStep(1);
    } else {
      onBack();
    }
  };

  // ── Shared confirm modal (used by both layouts) ─────────────────────────────
  const ConfirmModal = showConfirm ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
      <div className="relative bg-white rounded-2xl shadow-2xl mx-6 p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-[#003366] text-3xl">help</span>
          <h3 className="font-headline font-bold text-[#003366] text-lg">Confirm Registration</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">Please review your information before submitting.</p>
        <div className="flex flex-col items-center bg-[#1a4f8a] rounded-xl py-4 px-6 mb-4">
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Plate Number</p>
          <p className="font-headline font-black text-white text-3xl tracking-[0.2em] uppercase">{form.plate}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-5">
          <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium text-gray-800">{form.firstName} {form.lastName}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-gray-800 truncate max-w-[180px]">{form.email}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Barangay</span><span className="font-medium text-gray-800">{form.barangay}</span></div>
          <div className="h-px bg-gray-200 my-1" />
          <div className="flex justify-between"><span className="text-gray-500">Vehicle</span><span className="font-medium text-gray-800 capitalize">{vehicleType}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Fuel Type</span><span className="font-medium text-gray-800">{gasType}</span></div>
        </div>
        {confirmError && (
          <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm mb-4">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            {confirmError}
          </div>
        )}
        <div className="flex gap-3">
          <button type="button" disabled={registering} onClick={() => setShowConfirm(false)}
            className="flex-1 border border-outline-variant text-on-surface font-bold py-3 rounded-xl active:scale-95 transition-all disabled:opacity-50">
            Edit
          </button>
          <button type="button" disabled={registering} onClick={() => void handleConfirm()}
            className="flex-1 bg-primary-container text-white font-bold py-3 rounded-xl shadow active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {registering ? (
              <><span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>Registering…</>
            ) : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // ── Shared step tabs ─────────────────────────────────────────────────────────
  const StepTabs = ({ className = "" }: { className?: string }) => (
    <div className={`relative flex bg-slate-100 rounded-xl p-1 ${className}`}>
      <span
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-[#003366] shadow-sm transition-transform duration-300 ease-in-out"
        style={{ transform: step === 1 ? "translateX(0%)" : "translateX(calc(100% + 8px))" }}
      />
      <button type="button" onClick={() => { setError(""); setStep(1); }}
        className={`relative z-10 flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors duration-300 ${step === 1 ? "text-white" : "text-slate-400 hover:text-slate-600"}`}>
        1. Personal Info
      </button>
      <button type="button" onClick={() => {
        if (step === 1) {
          const { firstName, lastName, barangay, email, password, confirmPassword } = form;
          if (!firstName.trim() || !lastName.trim() || !barangay || !email.trim() || !password.trim() || !confirmPassword.trim()) { setError("Fill in all fields to continue."); return; }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Please enter a valid email address."); return; }
          if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
          if (password !== confirmPassword) { setError("Passwords do not match."); return; }
          setError("");
        }
        setStep(2);
      }}
        className={`relative z-10 flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors duration-300 ${step === 2 ? "text-white" : "text-slate-400 hover:text-slate-600"}`}>
        2. Vehicle Details
      </button>
    </div>
  );

  const inputCls = "w-full bg-white border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10 transition-all";
  const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1";

  return (
    <>
      {ConfirmModal}

      {/* ══ MOBILE layout (unchanged) ════════════════════════════════════════════ */}
      <div className="flex flex-col min-h-dvh bg-background lg:hidden">
        {/* Header */}
        <div className="flex items-center px-6 py-4 bg-slate-100/80 backdrop-blur-md shadow-sm sticky top-0 z-40 relative">
          <button type="button" onClick={handleBack} aria-label="Go back"
            className="p-2 hover:bg-slate-200/50 rounded-full transition-all active:scale-95 text-[#003366] absolute left-6">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col items-center w-full">
            <h1 className="text-[#003366] font-headline font-bold text-lg leading-none">AGAS Portal</h1>
            <p className="text-[10px] text-[#003366] font-black uppercase tracking-wider opacity-70">Registration</p>
          </div>
        </div>

        <main className="flex-1 px-6 pt-6 pb-12 max-w-md mx-auto w-full">
          <div className="mb-5">
            <h2 className="font-headline font-extrabold text-primary text-2xl">Register Account</h2>
            <p className="text-on-surface-variant text-sm mt-1">Fill in your personal and vehicle details.</p>
          </div>

          <StepTabs className="mb-6" />

          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Representative Name</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all" />
                  <input type="text" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Barangay</label>
                <BarangayPicker value={form.barangay} onChange={(b) => { setForm((p) => ({ ...p, barangay: b })); setError(""); }} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">mail</span>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="e.g. juan@email.com"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">lock</span>
                  <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-12 pr-12 text-sm focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all" />
                  <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                    <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">lock</span>
                  <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-12 pr-12 text-sm focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all" />
                  <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                    <span className="material-symbols-outlined text-xl">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>
              {error && <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm"><span className="material-symbols-outlined text-base">error</span>{error}</div>}
              <button type="submit" className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">Next</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Vehicle Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {VEHICLE_TYPES.map((v) => {
                    const active = vehicleType === v.id;
                    return (
                      <button key={v.id} type="button" onClick={() => setVehicleType(v.id)}
                        className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border-2 font-headline font-bold text-sm transition-all active:scale-95 ${active ? "bg-primary-container border-primary-container text-white shadow-lg" : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-primary-container/40"}`}>
                        <span className={`material-symbols-outlined text-[28px] ${active ? "icon-fill" : ""}`}>{v.icon}</span>
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Plate No.</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">
                    {vehicleType === "motorcycle" ? "two_wheeler" : vehicleType === "truck" ? "local_shipping" : "directions_car"}
                  </span>
                  <input type="text" name="plate" value={form.plate} onChange={handleChange}
                    placeholder={vehicleType === "motorcycle" ? "e.g. 1234AB" : "e.g. ABC-1234"} maxLength={10}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-12 pr-4 text-sm uppercase tracking-widest font-bold focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Fuel Type</label>
                <GasTypePicker value={gasType} onChange={(g) => { setGasType(g); setError(""); }} />
              </div>
              {error && <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm"><span className="material-symbols-outlined text-base">error</span>{error}</div>}
              <div className="bg-tertiary-fixed/30 border-l-4 border-tertiary p-3 rounded-r-lg flex gap-3 text-xs text-on-tertiary-fixed-variant">
                <span className="material-symbols-outlined text-tertiary text-base shrink-0">info</span>
                Your QR code will be available to view after registration is complete.
              </div>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <div className="relative shrink-0 mt-0.5">
                  <input type="checkbox" checked={agreedToTerms} onChange={(e) => { setAgreedToTerms(e.target.checked); setError(""); }} className="sr-only" />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${agreedToTerms ? "bg-[#003366] border-[#003366]" : "bg-white border-outline-variant"}`}>
                    {agreedToTerms && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                  </div>
                </div>
                <span className="text-xs text-on-surface-variant leading-relaxed">
                  I have read and agree to the <span className="font-semibold text-[#003366]">Terms and Conditions</span> and <span className="font-semibold text-[#003366]">Privacy Policy</span> of the AGAS Gas Allocation System.
                </span>
              </label>
              <button type="submit" className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined icon-fill">how_to_reg</span>Register
              </button>
            </form>
          )}
        </main>
      </div>

      {/* ══ DESKTOP layout ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex min-h-dvh flex-col bg-gradient-to-br from-[#003366] via-[#00254d] to-[#001a36]">
        {/* Breadcrumb */}
        <div className="px-10 pt-8 pb-4">
          <button type="button" onClick={handleBack}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>AGAS Portal</span>
            <span className="text-white/40 mx-1">/</span>
            <span className="text-white font-black uppercase tracking-widest text-xs">Registration</span>
          </button>
        </div>

        {/* Card */}
        <div className="flex-1 flex items-start justify-center px-4 pb-12">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl px-10 py-8">
            {/* Title */}
            <div className="mb-6">
              <h2 className="font-headline font-extrabold text-[#003366] text-3xl">Register Account</h2>
              <p className="text-gray-400 text-sm mt-1">Fill in your personal and vehicle details.</p>
            </div>

            <StepTabs className="mb-7" />

            {/* ── Step 1 ── */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-5">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>First Name</label>
                    <input type="text" name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name</label>
                    <input type="text" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" className={inputCls} />
                  </div>
                </div>

                {/* Barangay — native select for desktop */}
                <div>
                  <label className={labelCls}>Barangay</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px] pointer-events-none">location_on</span>
                    <select
                      value={form.barangay}
                      onChange={(e) => { setForm((p) => ({ ...p, barangay: e.target.value })); setError(""); }}
                      className={`${inputCls} pl-9 pr-8 appearance-none`}
                    >
                      <option value="">Select your barangay…</option>
                      {CEBU_BARANGAYS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px] pointer-events-none">expand_more</span>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className={labelCls}>Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px] pointer-events-none">mail</span>
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="e.g. juan@email.com" className={`${inputCls} pl-9`} />
                  </div>
                </div>

                {/* Password row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Password</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px] pointer-events-none">lock</span>
                      <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" className={`${inputCls} pl-9 pr-9`} />
                      <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Confirm Password</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px] pointer-events-none">lock</span>
                      <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password" className={`${inputCls} pl-9 pr-9`} />
                      <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined text-[18px]">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {error && <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-xs"><span className="material-symbols-outlined text-base">error</span>{error}</div>}

                <button type="submit" className="w-full bg-[#003366] text-white font-bold py-3 rounded-lg shadow hover:bg-[#002244] active:scale-95 transition-all text-sm">
                  Next
                </button>
              </form>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <form onSubmit={handleStep2} className="space-y-5">
                {/* Vehicle Type */}
                <div>
                  <label className={labelCls}>Vehicle Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {VEHICLE_TYPES.map((v) => {
                      const active = vehicleType === v.id;
                      return (
                        <button key={v.id} type="button" onClick={() => setVehicleType(v.id)}
                          className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 font-bold text-sm transition-all active:scale-95 ${active ? "bg-[#003366] border-[#003366] text-white shadow" : "bg-white border-gray-200 text-gray-500 hover:border-[#003366]/30"}`}>
                          <span className={`material-symbols-outlined text-[24px] ${active ? "icon-fill" : ""}`}>{v.icon}</span>
                          {v.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Plate */}
                <div>
                  <label className={labelCls}>Plate No.</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px] pointer-events-none">
                      {vehicleType === "motorcycle" ? "two_wheeler" : vehicleType === "truck" ? "local_shipping" : "directions_car"}
                    </span>
                    <input type="text" name="plate" value={form.plate} onChange={handleChange}
                      placeholder={vehicleType === "motorcycle" ? "e.g. 1234AB" : "e.g. ABC-1234"} maxLength={10}
                      className={`${inputCls} pl-9 uppercase tracking-widest font-bold`} />
                  </div>
                </div>

                {/* Fuel Type */}
                <div>
                  <label className={labelCls}>Fuel Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {GAS_TYPES.map((g) => {
                      const active = gasType === g.id;
                      return (
                        <button key={g.id} type="button" onClick={() => { setGasType(g.id); setError(""); }}
                          className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 font-bold text-sm transition-all active:scale-95 ${active ? g.activeClass : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                          <span className={`material-symbols-outlined text-[24px] ${active ? "icon-fill" : ""}`}>{g.icon}</span>
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-xs"><span className="material-symbols-outlined text-base">error</span>{error}</div>}

                <div className="bg-blue-50 border-l-4 border-[#003366] p-3 rounded-r-lg flex gap-3 text-xs text-[#003366]/80">
                  <span className="material-symbols-outlined text-[#003366] text-base shrink-0">info</span>
                  Your QR code will be available to view after registration is complete.
                </div>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <div className="relative shrink-0 mt-0.5">
                    <input type="checkbox" checked={agreedToTerms} onChange={(e) => { setAgreedToTerms(e.target.checked); setError(""); }} className="sr-only" />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${agreedToTerms ? "bg-[#003366] border-[#003366]" : "bg-white border-gray-300"}`}>
                      {agreedToTerms && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 leading-relaxed">
                    I have read and agree to the <span className="font-semibold text-[#003366]">Terms and Conditions</span> and <span className="font-semibold text-[#003366]">Privacy Policy</span> of the AGAS Gas Allocation System.
                  </span>
                </label>

                <button type="submit" className="w-full bg-[#003366] text-white font-bold py-3 rounded-lg shadow hover:bg-[#002244] active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined icon-fill text-[18px]">how_to_reg</span>Register
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

