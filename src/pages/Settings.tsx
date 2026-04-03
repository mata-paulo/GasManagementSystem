import { useState, useMemo } from "react";
import BottomNav from "../components/BottomNav";

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

const VEHICLE_TYPES = ["Car", "Motorcycle", "Tricycle", "Jeepney", "Truck", "Van"];
const GAS_TYPES     = ["Regular", "Diesel", "Premium"];

export default function Settings({ officer, activeTab, onTabChange, onLogout, onShowQR = undefined, onChangePassword = undefined, tabs = USER_TABS }) {
  const name        = officer ? `${officer.firstName || ""} ${officer.lastName || ""}`.trim() : "Station Officer";
  const plate       = officer?.plate       || "N/A";
  const vehicleType = officer?.vehicleType || "N/A";
  const barangay    = officer?.barangay    || "N/A";
  const gasType     = officer?.gasType     || "N/A";
  const initials    = `${officer?.firstName?.[0] ?? ""}${officer?.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  const [editing, setEditing] = useState(false);
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

  const selectField = (label: string, key: keyof typeof form, options: string[]) => (
    <div key={key}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <select
        title={label}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium bg-slate-50 focus:outline-none focus:border-[#003366] focus:bg-white"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  /* ── Edit Profile fullscreen overlay ── */
  if (editing) {
    return (
      <div className="flex flex-col min-h-dvh bg-[#f5f5f5]">
        {/* Header */}
        <div className="bg-[#003366] px-5 pt-10 pb-5 shrink-0">
          <div className="flex items-center gap-3 mb-1">
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
            {selectField("Vehicle Type", "vehicleType", VEHICLE_TYPES)}
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
            {field("Barangay", "barangay", "Enter your barangay")}
          </div>

          {/* Save */}
          <div className="mx-4 mt-5 space-y-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
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
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-[#f5f5f5] overflow-hidden">
      <main className="flex-1 pb-20 max-w-2xl mx-auto w-full flex flex-col justify-between overflow-hidden">

        {/* Profile card */}
        <div className="bg-[#003366] mx-4 mt-4 mb-1 rounded-2xl overflow-hidden shadow-md">
          {/* Top section */}
          <div className="flex items-center gap-4 px-5 pt-4 pb-3">
            <div className="w-14 h-14 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center shrink-0">
              <span className="text-white font-black text-xl">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-headline font-black text-white text-lg leading-tight truncate">{name}</p>
              <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-400/30 mt-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Active · Verified
              </span>
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
          © 2024 Mata Technologies Inc. · A.G.A.S
        </p>
      </main>

      <BottomNav active={activeTab} onChange={onTabChange} tabs={tabs} />
    </div>
  );
}
