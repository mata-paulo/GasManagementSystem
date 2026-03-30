import { useState } from "react";

export default function StationRegister({ onBack, onSuccess }) {
  const [form, setForm] = useState({
    stationName: "",
    officerFirstName: "",
    officerLastName: "",
    stationCode: "",
  });
  const [error, setError] = useState("");
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
const Brands = [
  "--- Select Brand ---",
  "Shell",
  "Petron",
  "Caltex",
  "Sea Oil",
  "Phoenix",
  "Uni Oil",
  "Rephil",
  "1st AutoGas",
  "Fueltech",
];

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { stationName, officerFirstName, officerLastName, stationCode } = form;

    if (
      !stationName.trim() ||
      !officerFirstName.trim() ||
      !officerLastName.trim() ||
      !stationCode.trim()
    ) {
      setError("All fields are required.");
      return;
    }

    onSuccess({
      stationName: stationName.trim(),
      officerFirstName: officerFirstName.trim(),
      officerLastName: officerLastName.trim(),
      stationCode: stationCode.trim().toUpperCase(),
      role: "station",
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
            Station Registration
          </h1>
          <p className="text-[10px] text-[#003366] font-black uppercase tracking-wider opacity-70">
            Cebu Fuel Val
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
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Brand
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">
                location_on
              </span>
              <select
                name="brand"
                value={form.brand}
                onChange={handleChange}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-12 pr-10 text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all appearance-none"
              >
                <option value="" disabled>
                  Brand
                </option>
                {Brands.map((b) => (
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
              Station ID
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