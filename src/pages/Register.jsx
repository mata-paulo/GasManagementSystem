import { useState, useMemo } from "react";

// Official 80 barangays of Cebu City
const CEBU_BARANGAYS = [
  "Adlaon",
  "Agsungot",
  "Apas",
  "Babag",
  "Bacayan",
  "Banilad",
  "Basak Pardo",
  "Basak San Nicolas",
  "Binaliw",
  "Budlaan",
  "Buhisan",
  "Bulacao",
  "Buot-Taup Pardo",
  "Busay",
  "Calamba",
  "Cambinocot",
  "Camputhaw",
  "Capitol Site",
  "Carreta",
  "Central Poblacion",
  "Cogon Pardo",
  "Cogon Ramos",
  "Day-as",
  "Duljo",
  "Ermita",
  "Guadalupe",
  "Guba",
  "Hipodromo",
  "Inayawan",
  "Kalubihan",
  "Kalunasan",
  "Kamagayan",
  "Kasambagan",
  "Kinasang-an Pardo",
  "Labangon",
  "Lahug",
  "Lorega San Miguel",
  "Lusaran",
  "Luz",
  "Mabini",
  "Mabolo",
  "Malubog",
  "Manipis",
  "Nasipit",
  "Nga-an",
  "Nivel Hills",
  "Non-oc",
  "Pari-an",
  "Pasil",
  "Pit-os",
  "Poblacion Pardo",
  "Pulangbato",
  "Pung-ol Sibugay",
  "Punta Princesa",
  "Quiot Pardo",
  "Ramos",
  "San Antonio",
  "San Jose",
  "San Nicolas Proper",
  "San Roque",
  "Santa Cruz",
  "Santa Lucia",
  "Santo Niño",
  "Sapangdaku",
  "Sawang Calero",
  "Sinsin",
  "Sirao",
  "Sudlon I",
  "Sudlon II",
  "T. Padilla",
  "Tabunan",
  "Tagbao",
  "Talamban",
  "Taptap",
  "Tejero",
  "Tinago",
  "Tisa",
  "To-ong Pardo",
  "Tugbongan",
  "Zapatera",
];

const GAS_TYPES = [
  {
    group: "Default",
    items: ["Diesel", "Premium Unleaded", "Regular Unleaded"],
  },
  {
    group: "Petron",
    items: [
      "Petron Blaze",
      "Petron Blaze 100",
      "Petron Diesel",
      "Petron Diesel Max",
      "Petron Diesel Max Euro 4",
      "Petron Turbo Diesel",
      "Petron XCS",
      "Petron XCS Euro 4",
      "Petron Xtra",
      "Petron Xtra Advance Euro 4",
      "Petron Xtra Diesel",
      "Petron Xtra Unleaded",
    ],
  },
  {
    group: "Caltex",
    items: [
      "Caltex Diesel",
      "Caltex Gold with Techron",
      "Caltex Platinum with Techron",
      "Caltex Power Diesel with Techron Diesel",
      "Caltex Premium",
      "Caltex Regular",
      "Caltex Silver Diesel",
      "Caltex Silver with Techron",
    ],
  },
  {
    group: "Phoenix",
    items: ["Phoenix Diesel", "Phoenix Premium", "Phoenix Regular"],
  },
  {
    group: "Shell",
    items: [
      "Shell FuelSave Diesel",
      "Shell FuelSave Gasoline",
      "Shell V-Power Diesel",
      "Shell V-Power Gasoline",
      "Shell V-Power Racing",
    ],
  },
  {
    group: "Others",
    items: [
      "Premium 95",
      "Unleaded 91",
      "Standard Diesel",
      "V-Power Racing",
      "XCS",
      "Xtra Advance",
      "XTRA",
      "Blaze",
      "Silver",
      "Platinum",
    ],
  },
];

const VEHICLE_TYPES = [
  { id: "car", label: "Car", icon: "directions_car" },
  { id: "truck", label: "Truck", icon: "local_shipping" },
  { id: "motorcycle", label: "Motorcycle", icon: "two_wheeler" },
];

function GasTypePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const allItems = GAS_TYPES.flatMap((g) => g.items);
  const totalCount = allItems.length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return GAS_TYPES;
    return GAS_TYPES.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [search]);

  const filteredCount = filtered.reduce((acc, g) => acc + g.items.length, 0);

  const handleSelect = (item) => {
    onChange(item);
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
          local_gas_station
        </span>
        <span className={value ? "text-on-surface" : "text-outline"}>
          {value || "Select gas type…"}
        </span>
        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">
          expand_more
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
          <div className="relative w-full bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[75vh]">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="px-4 pb-3 shrink-0 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#003366] text-base">Select Gas Type</h3>
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
                  placeholder="Search gas type..."
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

              <p className="text-xs text-gray-400 mt-1.5 ml-1">
                {search ? filteredCount : totalCount} type{(search ? filteredCount : totalCount) !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="overflow-y-auto flex-1 px-2 py-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">local_gas_station</span>
                  <p className="text-sm">No gas type found</p>
                </div>
              ) : (
                filtered.map((group) => (
                  <div key={group.group}>
                    <p className="text-[11px] font-bold text-[#003366]/60 uppercase tracking-widest px-4 pt-3 pb-1">
                      {group.group}
                    </p>
                    {group.items.map((item) => {
                      const selected = value === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleSelect(item)}
                          className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between text-sm transition-colors active:scale-[0.98] ${
                            selected
                              ? "bg-blue-50 text-[#003366] font-semibold"
                              : "text-gray-800 hover:bg-gray-50"
                          }`}
                        >
                          {item}
                          {selected && (
                            <span className="material-symbols-outlined text-[#003366] text-base">
                              check_circle
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="h-safe-area-inset-bottom shrink-0 pb-4" />
          </div>
        </div>
      )}
    </>
  );
}

function BarangayPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CEBU_BARANGAYS;
    return CEBU_BARANGAYS.filter((b) => b.toLowerCase().includes(q));
  }, [search]);

  const handleSelect = (b) => {
    onChange(b);
    setOpen(false);
    setSearch("");
  };

  const handleClose = () => {
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-12 pr-10 text-sm text-left transition-all focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 relative"
      >
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">
          location_on
        </span>
        <span className={value ? "text-on-surface" : "text-outline"}>
          {value || "Select your barangay…"}
        </span>
        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">
          expand_more
        </span>
      </button>

      {/* Bottom-sheet overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />

          {/* Sheet */}
          <div className="relative w-full bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[75vh]">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header + search */}
            <div className="px-4 pb-3 shrink-0 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#003366] text-base">Select Barangay</h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search barangay..."
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
                  {filtered.length} barangay{filtered.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 px-2 py-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">location_off</span>
                  <p className="text-sm">No barangay found</p>
                </div>
              ) : (
                filtered.map((b) => {
                  const selected = value === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleSelect(b)}
                      className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between text-sm transition-colors active:scale-[0.98] ${
                        selected
                          ? "bg-blue-50 text-[#003366] font-semibold"
                          : "text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`material-symbols-outlined text-base ${
                            selected ? "text-[#003366]" : "text-gray-300"
                          }`}
                        >
                          location_on
                        </span>
                        {b}
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

            {/* Safe area spacer for iOS */}
            <div className="h-safe-area-inset-bottom shrink-0 pb-4" />
          </div>
        </div>
      )}
    </>
  );
}

export default function Register({ onBack, onSuccess }) {
  const [vehicleType, setVehicleType] = useState("car");
  const [gasType, setGasType] = useState("");
  const [form, setForm] = useState({
    plate: "",
    lastName: "",
    firstName: "",
    barangay: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { plate, lastName, firstName, barangay } = form;

    if (!plate.trim() || !lastName.trim() || !firstName.trim() || !barangay || !gasType) {
      setError("All fields are required.");
      return;
    }

    onSuccess({
      vehicleType,
      plate: plate.trim().toUpperCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      barangay,
      gasType,
      role: "resident",
      registeredAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <div className="flex items-center gap-3 px-6 py-4 bg-slate-100/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-200/50 rounded-full transition-all active:scale-95 text-[#003366]"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-[#003366] font-headline font-bold text-lg leading-none">
            Citizen Portal
          </h1>
          <p className="text-[10px] text-[#003366] font-black uppercase tracking-wider opacity-70">
            Resident Registration
          </p>
        </div>
      </div>

      <main className="flex-1 px-6 pt-6 pb-12 max-w-md mx-auto w-full">
        <div className="mb-6">
          <h2 className="font-headline font-extrabold text-primary text-2xl">
            Register Your Vehicle
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Fill in your details to get your personal fuel allocation QR code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Vehicle Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {VEHICLE_TYPES.map((v) => {
                const active = vehicleType === v.id;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVehicleType(v.id)}
                    className={`flex items-center justify-center gap-3 py-4 rounded-xl border-2 font-headline font-bold text-sm transition-all active:scale-95 ${
                      active
                        ? "bg-primary-container border-primary-container text-white shadow-lg"
                        : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-primary-container/40"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "28px",
                        fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      {v.icon}
                    </span>
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Plate No.
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">
                {vehicleType === "motorcycle" ? "two_wheeler" : vehicleType === "truck" ? "local_shipping" : "directions_car"}
              </span>
              <input
                type="text"
                name="plate"
                value={form.plate}
                onChange={handleChange}
                placeholder={vehicleType === "motorcycle" ? "e.g. 1234AB" : "e.g. ABC-1234"}
                maxLength={10}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-12 pr-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all uppercase tracking-widest font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Gas Type
            </label>
            <GasTypePicker
              value={gasType}
              onChange={(g) => { setGasType(g); setError(""); }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="e.g. Juan"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="e.g. Dela Cruz"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Barangay
            </label>
            <BarangayPicker
              value={form.barangay}
              onChange={(b) => {
                setForm((prev) => ({ ...prev, barangay: b }));
                setError("");
              }}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          <div className="bg-tertiary-fixed/30 border-l-4 border-tertiary p-3 rounded-r-lg flex gap-3 text-xs text-on-tertiary-fixed-variant">
            <span className="material-symbols-outlined text-tertiary text-base shrink-0">
              info
            </span>
            A QR code will be generated with your vehicle type, plate number,
            full name, barangay, and registration timestamp.
          </div>

          <button
            type="submit"
            className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              qr_code
            </span>
            Generate My QR Code
          </button>
        </form>
      </main>
    </div>
  );
}
