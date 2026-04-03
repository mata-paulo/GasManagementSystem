import { useState } from "react";
import BottomNav from "../components/BottomNav";

const APP_VERSION = "V 1.0.0";

const BRAND_LOGO: Record<string, { bg: string; fg: string; abbr: string }> = {
  Shell:      { bg: "#FBCE07", fg: "#DD1D21", abbr: "SH" },
  Petron:     { bg: "#0059A7", fg: "#ffffff", abbr: "PE" },
  Caltex:     { bg: "#C8102E", fg: "#ffffff", abbr: "CX" },
  Phoenix:    { bg: "#F47920", fg: "#ffffff", abbr: "PX" },
  Seaoil:     { bg: "#00677F", fg: "#ffffff", abbr: "SO" },
  "Flying V": { bg: "#8B1A1A", fg: "#ffffff", abbr: "FV" },
  Diatoms:    { bg: "#2E7D32", fg: "#ffffff", abbr: "DI" },
  Default:    { bg: "#003366", fg: "#ffffff", abbr: "⛽" },
};

const menuItems = [

  { icon: "settings", label: "Settings", section: "main" },
  { icon: "help_outline", label: "Help & Support", section: "support" },
  { icon: "info", label: "About the App", section: "support" },
  { icon: "policy", label: "Privacy Policy", section: "support" },
];

const USER_TABS = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "user-history", icon: "receipt_long", label: "Transactions" },
  { id: "map", icon: "map", label: "Map" },
  { id: "settings", icon: "account_circle", label: "Account" },
];

const VEHICLE_TYPES = ["Car", "Motorcycle", "Truck"];
const GAS_TYPES     = ["Regular", "Diesel", "Premium"];

const BARANGAYS = [
  "Adlaon","Agsungot","Apas","Babag","Bagong Puhon","Banilad","Basak Pardo","Basak San Nicolas",
  "Binaliw","Bonbon","Buhisan","Bulacao","Buot-Taup","Busay","Calamba","Cambinocot","Camputhaw",
  "Capitol Site","Carreta","Central","Cogon Pardo","Cogon Ramos","Day-as","Duljo-Fatima","Ermita",
  "Ermita South","Guadalupe","Guba","Hippodromo","Inayawan","Kalubihan","Kalunasan","Kamagayan",
  "Kasambagan","Kinasang-an","Labangon","Lahug","Lorega","Lorega San Miguel","Lusaran","Luz",
  "Mabini","Mabolo","Malubog","Mambaling","Mantuyong","Mohon","Motore","Nasipit","Pardo",
  "Pahina Central","Pahina San Nicolas","Pamutan","Pari-an","Paril","Pasil","Pit-os",
  "Poblacion Pardo","Pulangbato","Punta Princesa","Quiot Pardo","Sambag I","Sambag II",
  "San Antonio","San Jose","San Nicolas Central","San Roque","Santa Cruz","Santo Niño",
  "Sapangdaku","Sawang Calero","Sinsin","Sirao","Sudlon I","Sudlon II","T. Padilla",
  "Talamban","Taptap","Tejero","Tinago","Tisa","To-ong Pardo","Tuburan","Tungkop","Zapatera",
].sort();

function PickerSheet({ title, options, value, onSelect, onClose }: {
  title: string; options: string[]; value: string;
  onSelect: (v: string) => void; onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Sheet */}
      <div className="relative bg-white rounded-t-2xl flex flex-col max-h-[75vh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
          <p className="font-bold text-[#003366] text-base">{title}</p>
          <button type="button" onClick={onClose}>
            <span className="material-symbols-outlined text-slate-400 text-[22px]">close</span>
          </button>
        </div>
        {/* Search */}
        <div className="px-4 py-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2.5">
            <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
            <input
              autoFocus
              type="text"
              placeholder={`Search ${title.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}>
                <span className="material-symbols-outlined text-slate-400 text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>
        {/* List */}
        <div className="overflow-y-auto flex-1 pb-6">
          {filtered.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">No results found</p>
          )}
          {filtered.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => { onSelect(option); onClose(); }}
              className={`w-full flex items-center justify-between px-5 py-3.5 border-b border-slate-50 text-left ${
                value === option ? "bg-blue-50" : "active:bg-slate-50"
              }`}
            >
              <span className={`text-sm font-medium ${value === option ? "text-[#003366] font-bold" : "text-slate-700"}`}>
                {option}
              </span>
              {value === option && (
                <span className="material-symbols-outlined text-[#003366] text-[18px]">check</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Settings({ officer, activeTab, onTabChange, onLogout, onShowQR = undefined, onChangePassword = undefined, onUpdateProfile = undefined, tabs = USER_TABS }) {
  const name        = officer ? `${officer.firstName || ""} ${officer.lastName || ""}`.trim() : "Station Officer";
  const plate       = officer?.plate       || "N/A";
  const vehicleType = officer?.vehicleType || "N/A";
  const barangay    = officer?.barangay    || "N/A";
  const gasType     = officer?.gasType     || "N/A";
  const initials    = `${officer?.firstName?.[0] ?? ""}${officer?.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  const [editing, setEditing] = useState(false);
  const [picker, setPicker] = useState<"vehicleType" | "barangay" | null>(null);
  const [form, setForm] = useState({
    firstName:   officer?.firstName   || "",
    lastName:    officer?.lastName    || "",
    plate:       officer?.plate       || "",
    vehicleType: officer?.vehicleType || "",
    barangay:    officer?.barangay    || "",
    gasType:     officer?.gasType     || "",
  });

  const brand = officer?.brand as string | undefined;
  const logo = brand ? (BRAND_LOGO[brand] ?? BRAND_LOGO.Default) : null;

  const grouped = menuItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  const sectionLabels = { main: "Account", support: "Support" };

  const field = (label: string, key: keyof typeof form, placeholder = "") => (
    <div key={key}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <input
        type="text"
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium bg-slate-50 focus:outline-none focus:border-[#003366] focus:bg-white"
      />
    </div>
  );

  const pickerTrigger = (label: string, key: "vehicleType" | "barangay") => (
    <div key={key}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <button
        type="button"
        onClick={() => setPicker(key)}
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50 flex items-center justify-between"
      >
        <span className={form[key] ? "text-slate-800" : "text-slate-400"}>
          {form[key] || `Select ${label.toLowerCase()}`}
        </span>
        <span className="material-symbols-outlined text-slate-400 text-[18px]">expand_more</span>
      </button>
    </div>
  );

  /* ── Edit Profile fullscreen overlay ── */
  if (editing) {
    return (
      <div className="flex flex-col min-h-dvh bg-[#f5f5f5]">
        {/* Header */}
        <div
          className="bg-[#003366] px-5 pb-5 shrink-0"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}
        >
          <div className="flex items-center gap-3 mt-3 mb-1">
            <button type="button" onClick={() => setEditing(false)} className="text-white/70 active:text-white">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="text-white font-headline font-black text-lg">Edit Profile</h1>
          </div>
          <p className="text-white/50 text-xs ml-9">Update your personal information</p>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto pb-10">
          <div className="mx-4 mt-5 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
            <p className="text-xs font-bold text-[#003366] uppercase tracking-widest">Personal Info</p>
            {field("First Name", "firstName", "Enter first name")}
            {field("Last Name", "lastName", "Enter last name")}
          </div>

          <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
            <p className="text-xs font-bold text-[#003366] uppercase tracking-widest">Vehicle & Fuel</p>
            {field("Plate Number", "plate", "e.g. ABC 1234")}
            {pickerTrigger("Vehicle Type", "vehicleType")}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fuel Type</p>
              <div className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-400 font-medium bg-slate-100 flex items-center justify-between">
                <span>{form.gasType || gasType}</span>
                <span className="material-symbols-outlined text-slate-300 text-[16px]">lock</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 ml-1">Fuel type is set during registration and cannot be changed.</p>
            </div>
          </div>

          <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
            <p className="text-xs font-bold text-[#003366] uppercase tracking-widest">Location</p>
            {pickerTrigger("Barangay", "barangay")}
          </div>

          {/* Save */}
          <div className="mx-4 mt-5 space-y-3">
            <button
              type="button"
              onClick={() => { onUpdateProfile?.(form); setEditing(false); }}
              className="w-full bg-[#003366] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => { setForm({ firstName: officer?.firstName || "", lastName: officer?.lastName || "", plate: officer?.plate || "", vehicleType: officer?.vehicleType || "", barangay: officer?.barangay || "", gasType: officer?.gasType || "" }); setEditing(false); }}
              className="w-full bg-white border border-slate-200 text-slate-500 font-bold py-3.5 rounded-2xl"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Pickers */}
        {picker === "vehicleType" && (
          <PickerSheet
            title="Vehicle Type"
            options={VEHICLE_TYPES}
            value={form.vehicleType}
            onSelect={(v) => setForm((f) => ({ ...f, vehicleType: v }))}
            onClose={() => setPicker(null)}
          />
        )}
        {picker === "barangay" && (
          <PickerSheet
            title="Barangay"
            options={BARANGAYS}
            value={form.barangay}
            onSelect={(v) => setForm((f) => ({ ...f, barangay: v }))}
            onClose={() => setPicker(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-[#f5f5f5] overflow-hidden">
      <main className="flex-1 pb-20 max-w-2xl mx-auto w-full flex flex-col justify-between overflow-hidden">

        {/* Profile card */}
        <div className="bg-white mx-4 mt-5 mb-1 rounded-2xl px-5 py-4 shadow-sm border border-outline-variant/10">
          <div className="flex items-center gap-4">
            {logo ? (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2"
                style={{ background: logo.bg, borderColor: logo.fg + "40" }}
              >
                <span className="font-headline font-black text-xl" style={{ color: logo.fg }}>
                  {logo.abbr}
                </span>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full border-2 border-[#2e7d32] flex items-center justify-center shrink-0 bg-white shadow-sm">
                <span className="material-symbols-outlined text-[#2e7d32] text-[28px]">
                  manage_accounts
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-headline font-black text-[#003366] text-lg leading-tight truncate">
                {name}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {brand ?? "View and edit profile"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center active:bg-white/20"
            >
              <span className="material-symbols-outlined text-white text-[18px]">edit</span>
            </button>
          </div>
          {/* Info grid */}
          <div className="grid grid-cols-2 border-t border-white/10">
            {[
              { icon: "directions_car",    label: "Plate No.",  value: plate },
              { icon: "commute",           label: "Vehicle",    value: vehicleType },
              { icon: "location_on",       label: "Barangay",   value: barangay },
              { icon: "local_gas_station", label: "Fuel Type",  value: gasType },
            ].map((d, i, arr) => (
              <div
                key={d.label}
                className={`flex items-center gap-3 px-5 py-3 ${i % 2 === 0 ? "border-r border-white/10" : ""} ${i < arr.length - 2 ? "border-b border-white/10" : ""}`}
              >
                <span className="material-symbols-outlined text-yellow-300 text-[18px] shrink-0">{d.icon}</span>
                <div className="min-w-0">
                  <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider">{d.label}</p>
                  <p className="text-white text-xs font-bold truncate">{d.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu groups */}
        {Object.entries(grouped).map(([section, items]) => (
          <div key={section} className="mt-3 mx-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
              {sectionLabels[section]}
            </p>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
              {items.map((item, i) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.label === "My QR Code" ? onShowQR : undefined}
                  className={`w-full flex items-center gap-4 px-5 py-3 transition-colors active:bg-slate-50 ${i < items.length - 1 ? "border-b border-slate-100" : ""}`}
                >
                  <span className="material-symbols-outlined text-[#003366] text-[22px] icon-outline">{item.icon}</span>
                  <span className="flex-1 text-sm font-medium text-slate-800 text-left">{item.label}</span>
                  <span className="material-symbols-outlined text-slate-300 text-[20px]">chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Version + Sign out */}
        <div className="mt-3 mx-4 bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
          {onChangePassword && (
            <button
              type="button"
              onClick={onChangePassword}
              className="w-full flex items-center gap-4 px-5 py-3 border-b border-slate-100 active:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[#003366] text-[22px]">lock_reset</span>
              <span className="flex-1 text-sm font-medium text-slate-800 text-left">Change Password</span>
              <span className="material-symbols-outlined text-slate-300 text-[20px]">chevron_right</span>
            </button>
          )}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[#003366] text-[22px]">smartphone</span>
              <span className="text-sm font-medium text-slate-800">Software Version</span>
            </div>
            <span className="text-sm font-bold text-slate-400">{APP_VERSION}</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-5 py-3 active:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-red-500 text-[22px]">logout</span>
            <span className="flex-1 text-sm font-medium text-red-500 text-left">Sign Out</span>
          </button>
        </div>

        <p className="text-center text-slate-300 text-[10px] pt-3 pb-1">
          © 2026 Mata Technologies Inc. · A.G.A.S
        </p>
      </main>

      <BottomNav active={activeTab} onChange={onTabChange} tabs={tabs} />
    </div>
  );
}

