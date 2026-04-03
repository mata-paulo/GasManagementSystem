import { useState, useMemo, type ChangeEvent, type FormEvent } from "react";

// Official 80 barangays of Cebu City
const CEBU_BARANGAYS = [
  "Adlaon", "Agsungot", "Apas", "Babag", "Bacayan", "Banilad",
  "Basak Pardo", "Basak San Nicolas", "Binaliw", "Budlaan", "Buhisan",
  "Bulacao", "Buot-Taup Pardo", "Busay", "Calamba", "Cambinocot",
  "Camputhaw", "Capitol Site", "Carreta", "Central Poblacion",
  "Cogon Pardo", "Cogon Ramos", "Day-as", "Duljo", "Ermita",
  "Guadalupe", "Guba", "Hipodromo", "Inayawan", "Kalubihan",
  "Kalunasan", "Kamagayan", "Kasambagan", "Kinasang-an Pardo",
  "Labangon", "Lahug", "Lorega San Miguel", "Lusaran", "Luz",
  "Mabini", "Mabolo", "Malubog", "Manipis", "Nasipit", "Nga-an",
  "Nivel Hills", "Non-oc", "Pari-an", "Pasil", "Pit-os",
  "Poblacion Pardo", "Pulangbato", "Pung-ol Sibugay", "Punta Princesa",
  "Quiot Pardo", "Ramos", "San Antonio", "San Jose", "San Nicolas Proper",
  "San Roque", "Santa Cruz", "Santa Lucia", "Santo Niño", "Sapangdaku",
  "Sawang Calero", "Sinsin", "Sirao", "Sudlon I", "Sudlon II",
  "T. Padilla", "Tabunan", "Tagbao", "Talamban", "Taptap", "Tejero",
  "Tinago", "Tisa", "To-ong Pardo", "Tugbongan", "Zapatera",
];

const BRANDS = [
  "Default", "Shell", "Petron", "Caltex", "Phoenix",
];

const BRAND_FUELS = {
  Default: ["Diesel", "Premium Diesel", "Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)"],
  Caltex: ["Diesel", "Premium Diesel", "Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)"],
  Petron: ["Diesel", "Premium Diesel", "Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)"],
  Phoenix: ["Diesel", "Premium Diesel", "Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)"],
  Shell: ["Diesel", "Premium Diesel", "Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)"],
};

type Brand = keyof typeof BRAND_FUELS;

type StationForm = {
  barangay: string;
  brand: Brand | "";
  officerFirstName: string;
  officerLastName: string;
  googleEmail: string;
  password: string;
  confirmPassword: string;
  stationCode: string;
};

type SheetPickerProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  icon: string;
};

function SheetPicker({ value, onChange, options, placeholder, icon }: SheetPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [search, options]);

  const handleSelect = (o: string) => {
    onChange(o);
    setOpen(false);
    setSearch("");
  };

  const handleClose = () => {
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-12 pr-10 text-sm text-left transition-all focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 relative"
      >
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">
          {icon}
        </span>
        <span className={value ? "text-on-surface" : "text-outline"}>
          {value || placeholder}
        </span>
        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">
          expand_more
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
          <div className="relative w-full bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[75vh]">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header + search */}
            <div className="px-4 pb-3 shrink-0 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#003366] text-base">{placeholder}</h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  placeholder={`Search ${placeholder.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-symbols-outlined text-base">cancel</span>
                  </button>
                )}
              </div>
              {filtered.length > 0 && (
                <p className="text-xs text-gray-400 mt-1.5 ml-1">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 px-2 py-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                  <p className="text-sm">No results found</p>
                </div>
              ) : (
                filtered.map((o) => {
                  const selected = value === o;
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => handleSelect(o)}
                      className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between text-sm transition-colors active:scale-[0.98] ${
                        selected
                          ? "bg-blue-50 text-[#003366] font-semibold"
                          : "text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-base ${selected ? "text-[#003366]" : "text-gray-300"}`}>
                          {icon}
                        </span>
                        {o}
                      </div>
                      {selected && (
                        <span className="material-symbols-outlined text-[#003366] text-base">
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="shrink-0 pb-4" />
          </div>
        </div>
      )}
    </>
  );
}

type StationRegisterProps = {
  onBack: () => void;
  onSuccess: (payload: {
    barangay: string;
    brand: string;
    officerFirstName: string;
    officerLastName: string;
    googleEmail: string;
    password: string;
    availableFuels: string[];
    fuelCapacities: Record<string, number>;
    stationCode: string;
    role: string;
    registeredAt: string;
  }) => void;
};

export default function StationRegister({ onBack, onSuccess }: StationRegisterProps) {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState<StationForm>({
    barangay: "",
    brand: "",
    officerFirstName: "",
    officerLastName: "",
    googleEmail: "",
    password: "",
    confirmPassword: "",
    stationCode: "",
  });
  const [fuelCapacities, setFuelCapacities] = useState<Record<string, string>>({});
  const [enabledFuels, setEnabledFuels] = useState<Set<string>>(new Set());
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const selectedFuels = form.brand ? BRAND_FUELS[form.brand] : [];
  const activeFuels = selectedFuels.filter((f) => enabledFuels.has(f));

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const validateStepOne = () => {
    const {
      officerFirstName,
      officerLastName,
      googleEmail,
      password,
      confirmPassword,
    } = form;
    if (
      !officerFirstName.trim() ||
      !officerLastName.trim() ||
      !googleEmail.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError("Please complete all details first.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return false;
    }
    return true;
  };

  const validateStepTwo = () => {
    if (!form.stationCode.trim()) {
      setError("Please enter station number.");
      return false;
    }
    if (!form.brand) {
      setError("Please select a brand.");
      return false;
    }
    if (activeFuels.length === 0) {
      setError("Please enable at least one fuel type.");
      return false;
    }
    const hasInvalidFuelCapacity = activeFuels.some((fuel) => {
      const value = fuelCapacities[fuel];
      return !value || Number(value) <= 0;
    });
    if (hasInvalidFuelCapacity) {
      setError("Please enter capacity for all enabled fuel types.");
      return false;
    }
    if (!agreedToTerms) {
      setError("You must agree to the Terms and Conditions to proceed.");
      return false;
    }
    return true;
  };

  const goToStepTwo = () => {
    if (!validateStepOne()) return;
    setError("");
    setStep(2);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateStepTwo()) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    const { barangay, brand, officerFirstName, officerLastName, googleEmail, password, stationCode } = form;
    setShowConfirm(false);
    onSuccess({
      barangay,
      brand,
      officerFirstName: officerFirstName.trim(),
      officerLastName: officerLastName.trim(),
      googleEmail: googleEmail.trim(),
      password,
      availableFuels: activeFuels,
      fuelCapacities: Object.fromEntries(
        activeFuels.map((fuel) => [fuel, Number(fuelCapacities[fuel] || 0)])
      ),
      stationCode: stationCode.trim().toUpperCase(),
      role: "station",
      registeredAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl mx-6 p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-[#003366] text-3xl">help</span>
              <h3 className="font-headline font-bold text-[#003366] text-lg">Confirm Registration</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Are you sure your information is correct?</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm mb-5">
              <div className="flex justify-between"><span className="text-gray-500">Barangay</span><span className="font-medium text-gray-800">{form.barangay}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Brand</span><span className="font-medium text-gray-800">{form.brand}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Representative</span><span className="font-medium text-gray-800">{`${form.officerFirstName} ${form.officerLastName}`.trim()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Fuel Types</span><span className="font-medium text-gray-800">{activeFuels.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Station No.</span><span className="font-medium text-gray-800 uppercase">{form.stationCode}</span></div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-outline-variant text-on-surface font-bold py-3 rounded-xl active:scale-95 transition-all"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 bg-primary-container text-white font-bold py-3 rounded-xl shadow active:scale-95 transition-all"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 px-6 py-4 bg-slate-100/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-200/50 rounded-full transition-all active:scale-95 text-[#003366]"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-[#003366] font-headline font-bold text-lg leading-none">
            Station Registration
          </h1>
          <p className="text-[10px] text-[#003366] font-black uppercase tracking-wider opacity-70">
            A.G.A.S
          </p>
        </div>
      </div>

      <main className="flex-1 px-6 pt-8 pb-12 max-w-md mx-auto w-full">
        <div className="mb-6">
          <h2 className="font-headline font-extrabold text-primary text-2xl">
            Register Station
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Fill in the station and officer details.
          </p>
        </div>

        <div className="mb-5 relative grid grid-cols-2 gap-2 rounded-xl bg-surface-container-low p-1 overflow-hidden">
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-lg bg-[#003366] shadow-sm transition-transform duration-300 ease-out ${
              step === 1 ? "translate-x-0" : "translate-x-[calc(100%+0.5rem)]"
            }`}
          />
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`relative z-10 rounded-lg py-2 text-xs font-bold transition-colors duration-300 ${
              step === 1 ? "text-white" : "text-slate-500"
            }`}
          >
            1. Details
          </button>
          <button
            type="button"
            onClick={() => {
              if (step === 2 || validateStepOne()) {
                setError("");
                setStep(2);
              }
            }}
            className={`relative z-10 rounded-lg py-2 text-xs font-bold transition-colors duration-300 ${
              step === 2 ? "text-white" : "text-slate-500"
            }`}
          >
            2. Station Information
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
            

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Representative Name
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="officerFirstName"
                    value={form.officerFirstName}
                    onChange={handleChange}
                    placeholder="First name"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm"
                  />
                  <input
                    type="text"
                    name="officerLastName"
                    value={form.officerLastName}
                    onChange={handleChange}
                    placeholder="Last name"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  name="googleEmail"
                  value={form.googleEmail}
                  onChange={handleChange}
                  placeholder="e.g. juan@gmail.com"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-4 pr-12 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-4 pr-12 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showConfirmPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              
            </>
          )}

          {step === 2 && (
            <>
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Station Number
                </label>
                <input
                  type="text"
                  name="stationCode"
                  value={form.stationCode}
                  onChange={handleChange}
                  placeholder="e.g. STF-001"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Barangay
                </label>
                <SheetPicker
                  value={form.barangay}
                  onChange={(b) => {
                    setForm((prev) => ({ ...prev, barangay: b as StationForm["barangay"] }));
                    setError("");
                  }}
                  options={CEBU_BARANGAYS}
                  placeholder="Select station barangay…"
                  icon="location_on"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Brand
                </label>
                <SheetPicker
                  value={form.brand}
                  onChange={(b) => {
                    setForm((prev) => ({ ...prev, brand: b as Brand }));
                    const fuels = BRAND_FUELS[b as Brand] || [];
                    setFuelCapacities(Object.fromEntries(fuels.map((fuel) => [fuel, ""])));
                    setEnabledFuels(new Set(fuels));
                    setError("");
                  }}
                  options={BRANDS}
                  placeholder="Select brand…"
                  icon="local_gas_station"
                />
              </div>

              {selectedFuels.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Fuel Types &amp; Capacity
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">{activeFuels.length} of {selectedFuels.length} enabled</span>
                  </div>
                  {selectedFuels.map((fuel) => {
                    const isEnabled = enabledFuels.has(fuel);
                    return (
                      <div
                        key={fuel}
                        className={`rounded-xl border px-3 py-2.5 transition-all ${isEnabled ? "bg-surface-container-lowest border-outline-variant" : "bg-slate-50 border-slate-200 opacity-60"}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className={`text-xs font-semibold leading-tight ${isEnabled ? "text-on-surface-variant" : "text-slate-400"}`}>{fuel}</p>
                          {/* Toggle switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isEnabled}
                            onClick={() => {
                              setEnabledFuels((prev) => {
                                const next = new Set(prev);
                                if (next.has(fuel)) next.delete(fuel);
                                else next.add(fuel);
                                return next;
                              });
                              setError("");
                            }}
                            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${isEnabled ? "bg-[#003366]" : "bg-slate-300"}`}
                          >
                            <span
                              className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform duration-200 ${isEnabled ? "translate-x-5" : "translate-x-0.5"}`}
                            />
                          </button>
                        </div>
                        {isEnabled && (
                          <div className="mt-2 flex items-center gap-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Capacity</label>
                            <div className="relative flex-1">
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={fuelCapacities[fuel] || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFuelCapacities((prev) => ({ ...prev, [fuel]: value }));
                                  setError("");
                                }}
                                placeholder="0"
                                className="w-full bg-white border border-outline-variant rounded-lg py-2 pl-3 pr-7 text-sm text-right"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-outline">L</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Terms & Conditions */}
              <label className="flex items-start gap-3 cursor-pointer select-none mt-1">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => { setAgreedToTerms(e.target.checked); setError(""); }}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${agreedToTerms ? "bg-[#003366] border-[#003366]" : "bg-white border-slate-300"}`}
                  >
                    {agreedToTerms && (
                      <span className="material-symbols-outlined text-white" style={{ fontSize: "14px", fontVariationSettings: "'wght' 700" }}>check</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-600 leading-relaxed">
                  I have read and agree to the{" "}
                  <span className="font-bold text-[#003366]">Terms and Conditions</span>{" "}
                  and{" "}
                  <span className="font-bold text-[#003366]">Privacy Policy</span>{" "}
                  of the Fuel Rationing System.
                </span>
              </label>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={goToStepTwo}
              className="w-full bg-primary-container text-white font-headline font-bold py-4  rounded-xl shadow-lg active:scale-95 transition-all"
            >
              Next
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
                className="w-full border border-outline-variant text-on-surface font-headline font-bold py-4 rounded-xl active:scale-95 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
              >
                Create Account
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

