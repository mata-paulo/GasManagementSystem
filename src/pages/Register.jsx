import { useState } from "react";

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
  "Escario",
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
  "Manggis",
  "Manipis",
  "Manueva",
  "Marcelo Fernan",
  "Mipangi",
  "Monte Fresco",
  "Nasipit",
  "Nga-an",
  "Nivel Hills",
  "Non-oc",
  "Odlot",
  "Pari-an",
  "Paril",
  "Pasil",
  "Pit-os",
  "Poblacion Pardo",
  "Pulangbato",
  "Pung-ol Sibugay",
  "Punta Princesa",
  "Quiot Pardo",
  "Rahum",
  "Raim",
  "Ratay",
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
  "Señor",
  "Sibugay",
  "Sinsin",
  "Sirao",
  "Suba Pasil",
  "Suba-basbas",
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
  "Toong",
  "Tugbongan",
  "Zapatera",
];

const VEHICLE_TYPES = [
  { id: "car", label: "Car", icon: "directions_car" },
  { id: "motorcycle", label: "Motorcycle", icon: "two_wheeler" },
];

export default function Register({ onBack, onSuccess }) {
  const [vehicleType, setVehicleType] = useState("car");
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

    if (!plate.trim() || !lastName.trim() || !firstName.trim() || !barangay) {
      setError("All fields are required.");
      return;
    }

    onSuccess({
      vehicleType,
      plate: plate.trim().toUpperCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      barangay,
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
            <div className="grid grid-cols-2 gap-3">
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
                {vehicleType === "motorcycle" ? "two_wheeler" : "directions_car"}
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
              Barangay
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">
                location_on
              </span>
              <select
                name="barangay"
                value={form.barangay}
                onChange={handleChange}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-12 pr-10 text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all appearance-none"
              >
                <option value="" disabled>
                  Select your barangay…
                </option>
                {CEBU_BARANGAYS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">
                expand_more
              </span>
            </div>
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
            className="w-full bg-tertiary text-on-tertiary font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
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