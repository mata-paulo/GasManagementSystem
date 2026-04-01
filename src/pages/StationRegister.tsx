import { useState, useMemo } from "react";

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
  "Shell", "Petron", "Caltex", "Sea Oil", "Phoenix",
  "Uni Oil", "Rephil", "1st AutoGas", "Fueltech",
];

function SheetPicker({ value, onChange, options, placeholder, icon }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [search, options]);

  const handleSelect = (o) => {
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

export default function StationRegister({ onBack, onSuccess }) {
  const [form, setForm] = useState({
    barangay: "",
    brand: "",
    officerFirstName: "",
    googleEmail: "",
    capacity: "",
    stationCode: "",
  });
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { barangay, brand, officerFirstName, googleEmail, capacity, stationCode } = form;

    if (
      !barangay ||
      !brand ||
      !officerFirstName.trim() ||
      !googleEmail.trim() ||
      !capacity.toString().trim() ||
      !stationCode.trim()
    ) {
      setError("All fields are required.");
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = () => {
    const { barangay, brand, officerFirstName, capacity, stationCode } = form;
    setShowConfirm(false);
    onSuccess({
      barangay,
      brand,
      officerFirstName: officerFirstName.trim(),
      googleEmail: googleEmail.trim(),
      capacity,
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
              <div className="flex justify-between"><span className="text-gray-500">Manager</span><span className="font-medium text-gray-800">{form.officerFirstName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Capacity</span><span className="font-medium text-gray-800">{form.capacity} L</span></div>
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
            Fuel Rationing System
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Barangay
            </label>
            <SheetPicker
              value={form.barangay}
              onChange={(b) => {
                setForm((prev) => ({ ...prev, barangay: b }));
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
                setForm((prev) => ({ ...prev, brand: b }));
                setError("");
              }}
              options={BRANDS}
              placeholder="Select brand…"
              icon="local_gas_station"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Manager Name
            </label>
            <input
              type="text"
              name="officerFirstName"
              value={form.officerFirstName}
              onChange={handleChange}
              placeholder="e.g. Juan"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Google Email
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
              Station Capacity
            </label>
            <input
              type="number"
              name="capacity"
              value={form.capacity}
              onChange={handleChange}
              placeholder="e.g. 150,000 (liters)"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm"
            />
          </div>

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

          {error && (
            <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
          >
            Create Station Account
          </button>
        </form>
      </main>
    </div>
  );
}
