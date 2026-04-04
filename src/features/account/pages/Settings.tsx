import { useState } from "react";
import BottomNav from "@/shared/components/navigation/BottomNav";

const APP_VERSION = "V 1.0.0";

const menuItems = [
  { icon: "qr_code", label: "My QR Code", section: "main" },
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
      <div className="flex flex-col h-dvh bg-[#f5f5f5] overflow-hidden">
        {/* Header */}
        <div className="bg-[#003366] px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setEditing(false)} className="text-white/70 active:text-white">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-white font-headline font-black text-lg leading-none">Edit Profile</h1>
              <p className="text-white/50 text-xs mt-0.5">Update your personal information</p>
            </div>
          </div>
        </div>

        {/* Form — no scroll, fits screen */}
        <div className="flex-1 flex flex-col px-4 py-4 gap-3 overflow-hidden">

          {/* Personal Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-3 space-y-3">
            <p className="text-[10px] font-bold text-[#003366] uppercase tracking-widest">Personal Info</p>
            <div className="grid grid-cols-2 gap-3">
              {field("First Name", "firstName", "Enter first name")}
              {field("Last Name", "lastName", "Enter last name")}
            </div>
          </div>

          {/* Vehicle & Fuel */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-3 space-y-3">
            <p className="text-[10px] font-bold text-[#003366] uppercase tracking-widest">Vehicle & Fuel</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plate Number</p>
                <div className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-400 font-medium bg-slate-100 flex items-center justify-between">
                  <span>{form.plate || plate}</span>
                  <span className="material-symbols-outlined text-slate-300 text-[16px]">lock</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vehicle Type</p>
                <div className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-400 font-medium bg-slate-100 flex items-center justify-between">
                  <span>{form.vehicleType || vehicleType}</span>
                  <span className="material-symbols-outlined text-slate-300 text-[16px]">lock</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fuel Type</p>
              <div className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-400 font-medium bg-slate-100 flex items-center justify-between">
                <span>{form.gasType || gasType}</span>
                <span className="material-symbols-outlined text-slate-300 text-[16px]">lock</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-3 space-y-3">
            <p className="text-[10px] font-bold text-[#003366] uppercase tracking-widest">Location</p>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Barangay</p>
              <div className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-400 font-medium bg-slate-100 flex items-center justify-between">
                <span>{form.barangay || barangay}</span>
                <span className="material-symbols-outlined text-slate-300 text-[16px]">lock</span>
              </div>
            </div>
          </div>

          {/* Buttons — pushed to bottom */}
          <div className="flex gap-3 mt-auto">
            <button
              type="button"
              onClick={() => { setForm({ firstName: officer?.firstName || "", lastName: officer?.lastName || "", plate: officer?.plate || "", vehicleType: officer?.vehicleType || "", barangay: officer?.barangay || "", gasType: officer?.gasType || "" }); setEditing(false); }}
              className="flex-1 bg-white border border-slate-200 text-slate-500 font-bold py-3 rounded-2xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { onUpdateProfile?.(form); setEditing(false); }}
              className="flex-1 bg-[#003366] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save Changes
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
    <div className="flex flex-col min-h-dvh bg-[#f5f5f5]">
      <main className="flex flex-col flex-1 pb-36 max-w-2xl mx-auto w-full">

        {/* Profile card */}
        <div className="mx-4 mt-5 mb-1 rounded-2xl overflow-hidden shadow-sm"
          style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d3270 100%)" }}>
          {/* Top row */}
          <div className="flex items-center gap-3 px-5 pt-4 pb-3">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white/60 text-[26px]">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full px-2 py-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Active · Verified</span>
                </span>
              </div>
              <p className="font-headline font-black text-white text-sm leading-tight truncate mt-1">{name}</p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center active:bg-white/20"
            >
              <span className="material-symbols-outlined text-white/70 text-[18px]">edit</span>
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
              <div key={d.label}
                className={`flex items-center gap-3 px-5 py-3 ${i % 2 === 0 ? "border-r border-white/10" : ""} ${i < arr.length - 2 ? "border-b border-white/10" : ""}`}>
                <span className="material-symbols-outlined text-yellow-300 text-[18px] shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}>{d.icon}</span>
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

