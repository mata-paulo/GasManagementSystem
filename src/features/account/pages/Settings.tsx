import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
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

export default function Settings({ officer, activeTab, onTabChange, onLogout, onShowQR = undefined, onChangePassword = undefined, onUpdateProfile = undefined, tabs = USER_TABS, selectedVehicle: selectedVehicleProp = 1, onSelectVehicle = undefined }) {
  const name        = officer ? `${officer.firstName || ""} ${officer.lastName || ""}`.trim() : "Station Officer";
  const plate       = officer?.plate       || "N/A";
  const vehicleType = officer?.vehicleType || "N/A";
  const barangay    = officer?.barangay    || "N/A";
  const gasType     = officer?.gasType     || "N/A";
  const initials    = `${officer?.firstName?.[0] ?? ""}${officer?.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  const [editing, setEditing] = useState(false);
  const [picker, setPicker] = useState<"vehicleType" | "barangay" | null>(null);
  const selectedVehicle = selectedVehicleProp as 1 | 2;
  const setSelectedVehicle = (v: 1 | 2) => onSelectVehicle?.(v);
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [v2Form, setV2Form] = useState({ vehicle2Type: "car", vehicle2Plate: "", vehicle2GasType: "" });
  const [v2Saving, setV2Saving] = useState(false);
  const [v2Error, setV2Error] = useState("");
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
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-[#003366] uppercase tracking-widest">Vehicle & Fuel</p>
              {officer?.vehicle2Plate && (
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  {([1, 2] as const).map((n) => (
                    <button key={n} type="button"
                      onClick={() => setSelectedVehicle(n)}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${selectedVehicle === n ? "bg-white text-[#003366] shadow" : "text-slate-400"}`}>
                      V{n}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plate Number</p>
                <div className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-400 font-medium bg-slate-100 flex items-center justify-between">
                  <span>{selectedVehicle === 2 ? (officer?.vehicle2Plate || "N/A") : (form.plate || plate)}</span>
                  <span className="material-symbols-outlined text-slate-300 text-[16px]">lock</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vehicle Type</p>
                <div className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-400 font-medium bg-slate-100 flex items-center justify-between">
                  <span className="capitalize">{selectedVehicle === 2 ? (officer?.vehicle2Type || "N/A") : (form.vehicleType || vehicleType)}</span>
                  <span className="material-symbols-outlined text-slate-300 text-[16px]">lock</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fuel Type</p>
              <div className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-400 font-medium bg-slate-100 flex items-center justify-between">
                <span>{selectedVehicle === 2 ? (officer?.vehicle2GasType || "N/A") : (form.gasType || gasType)}</span>
                <span className="material-symbols-outlined text-slate-300 text-[16px]">lock</span>
              </div>
            </div>
            {!officer?.vehicle2Plate && (
              <button
                type="button"
                onClick={() => setAddingVehicle(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 text-xs font-bold hover:border-[#003366]/40 hover:text-[#003366] transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Add Vehicle
              </button>
            )}
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

        {/* Add Vehicle sheet — only accessible from Edit Profile */}
        {addingVehicle && (
          <div className="fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/50" onClick={() => { setAddingVehicle(false); setV2Error(""); }} />
            <div className="relative w-full bg-white rounded-t-2xl shadow-2xl px-5 pt-5 pb-10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-headline font-bold text-[#003366] text-base">Add Vehicle</h3>
                <button type="button" onClick={() => { setAddingVehicle(false); setV2Error(""); }} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Vehicle Type */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Type</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "car", label: "Car", icon: "directions_car" },
                    { id: "truck", label: "Truck", icon: "local_shipping" },
                    { id: "motorcycle", label: "Motorcycle", icon: "two_wheeler" },
                  ].map((v) => {
                    const active = v2Form.vehicle2Type === v.id;
                    return (
                      <button key={v.id} type="button"
                        onClick={() => setV2Form((f) => ({ ...f, vehicle2Type: v.id }))}
                        className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 font-bold text-xs transition-all active:scale-95 ${active ? "bg-[#003366] border-[#003366] text-white shadow" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                        <span className={`material-symbols-outlined text-[22px] ${active ? "icon-fill" : ""}`}>{v.icon}</span>
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Plate No. */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plate No.</p>
                <input
                  type="text"
                  value={v2Form.vehicle2Plate}
                  onChange={(e) => setV2Form((f) => ({ ...f, vehicle2Plate: e.target.value.toUpperCase() }))}
                  placeholder={v2Form.vehicle2Type === "motorcycle" ? "e.g. 1234AB" : "e.g. ABC-1234"}
                  maxLength={10}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-[#003366]"
                />
              </div>

              {/* Fuel Type */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fuel Type</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "Diesel", label: "Diesel", icon: "oil_barrel", active: "bg-emerald-700 border-emerald-700 text-white" },
                    { id: "Gasoline", label: "Gasoline", icon: "local_gas_station", active: "bg-red-600 border-red-600 text-white" },
                  ].map((g) => {
                    const active = v2Form.vehicle2GasType === g.id;
                    return (
                      <button key={g.id} type="button"
                        onClick={() => setV2Form((f) => ({ ...f, vehicle2GasType: g.id }))}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 font-bold text-sm transition-all active:scale-95 ${active ? g.active : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                        <span className={`material-symbols-outlined text-[24px] ${active ? "icon-fill" : ""}`}>{g.icon}</span>
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {v2Error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-xl text-xs">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  {v2Error}
                </div>
              )}

              <button
                type="button"
                disabled={v2Saving}
                onClick={async () => {
                  if (!v2Form.vehicle2Plate.trim()) { setV2Error("Please enter the plate number."); return; }
                  if (!v2Form.vehicle2GasType) { setV2Error("Please select a fuel type."); return; }
                  if (!officer?.uid) { setV2Error("User session error. Please log out and log back in."); return; }
                  setV2Saving(true);
                  setV2Error("");
                  try {
                    const plate2 = v2Form.vehicle2Plate.trim().toUpperCase();
                    await updateDoc(doc(db, "accounts", officer.uid as string), {
                      vehicle2Type: v2Form.vehicle2Type,
                      vehicle2Plate: plate2,
                      vehicle2GasType: v2Form.vehicle2GasType,
                    });
                    onUpdateProfile?.({ vehicle2Type: v2Form.vehicle2Type, vehicle2Plate: plate2, vehicle2GasType: v2Form.vehicle2GasType });
                    setAddingVehicle(false);
                    setV2Form({ vehicle2Type: "car", vehicle2Plate: "", vehicle2GasType: "" });
                  } catch {
                    setV2Error("Failed to save. Please try again.");
                  } finally {
                    setV2Saving(false);
                  }
                }}
                className="w-full bg-[#003366] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {v2Saving
                  ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Saving…</>
                  : <><span className="material-symbols-outlined text-[18px]">add_circle</span>Add Vehicle</>}
              </button>
            </div>
          </div>
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
              { icon: "directions_car",    label: "Plate No.",  value: selectedVehicle === 2 ? (officer?.vehicle2Plate || "N/A") : plate, isPlate: true },
              { icon: "commute",           label: "Vehicle",    value: selectedVehicle === 2 ? (officer?.vehicle2Type  || "N/A") : vehicleType },
              { icon: "location_on",       label: "Barangay",   value: barangay },
              { icon: "local_gas_station", label: "Fuel Type",  value: selectedVehicle === 2 ? (officer?.vehicle2GasType || "N/A") : gasType },
            ].map((d, i, arr) => {
              const isSwappable = d.isPlate && !!officer?.vehicle2Plate;
              const inner = (
                <>
                  <span className="material-symbols-outlined text-yellow-300 text-[18px] shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1" }}>{d.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider">{d.label}</p>
                      {isSwappable && (
                        <span className="flex items-center gap-0.5 text-white/60">
                          <span className="text-[8px] font-bold uppercase">V{selectedVehicle}</span>
                          <span className="material-symbols-outlined text-[11px]">swap_vert</span>
                        </span>
                      )}
                    </div>
                    <p className="text-white text-xs font-bold truncate capitalize">{d.value}</p>
                  </div>
                </>
              );
              return isSwappable ? (
                <button key={d.label} type="button"
                  onClick={() => setSelectedVehicle(selectedVehicle === 1 ? 2 : 1)}
                  className={`flex items-center gap-3 px-5 py-3 active:bg-white/10 transition-colors w-full text-left ${i % 2 === 0 ? "border-r border-white/10" : ""} ${i < arr.length - 2 ? "border-b border-white/10" : ""}`}>
                  {inner}
                </button>
              ) : (
                <div key={d.label}
                  className={`flex items-center gap-3 px-5 py-3 ${i % 2 === 0 ? "border-r border-white/10" : ""} ${i < arr.length - 2 ? "border-b border-white/10" : ""}`}>
                  {inner}
                </div>
              );
            })}
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

