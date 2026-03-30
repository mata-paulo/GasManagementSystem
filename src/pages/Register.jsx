import { useState } from "react";

export default function Register({ onBack, onSuccess }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", plate: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { firstName, lastName, plate } = form;
    if (!firstName.trim() || !lastName.trim() || !plate.trim()) {
      setError("All fields are required.");
      return;
    }
    // Basic plate format hint (not strict)
    const plateClean = plate.trim().toUpperCase();
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      plate: plateClean,
      registeredAt: new Date().toISOString(),
    };
    onSuccess(payload);
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-slate-100/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-200/50 rounded-full transition-all active:scale-95 text-[#003366]"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-[#003366] font-headline font-bold text-lg leading-none">
            Resident Registration
          </h1>
          <p className="text-[10px] text-[#003366] font-black uppercase tracking-wider opacity-70">
            Cebu Fuel Val
          </p>
        </div>
      </div>

      <main className="flex-1 px-6 pt-8 pb-12 max-w-md mx-auto w-full">
        {/* Icon + intro */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-tertiary flex items-center justify-center mb-4 shadow-lg">
            <span
              className="material-symbols-outlined text-on-tertiary"
              style={{ fontSize: "40px", fontVariationSettings: "'FILL' 1" }}
            >
              qr_code
            </span>
          </div>
          <h2 className="font-headline font-extrabold text-primary text-2xl">Register</h2>
          <p className="text-on-surface-variant text-sm text-center mt-1 max-w-[260px]">
            Fill in your details to receive your personal fuel allocation QR code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plate Number — first as it's the primary ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Plate Number
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">
                directions_car
              </span>
              <input
                type="text"
                name="plate"
                value={form.plate}
                onChange={handleChange}
                placeholder="e.g. ABC-1234"
                maxLength={10}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-12 pr-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all uppercase tracking-widest font-bold"
              />
            </div>
            <p className="text-[10px] text-outline pl-1">Your vehicle's official plate number</p>
          </div>

          {/* First Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              First Name
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">
                person
              </span>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="e.g. Juan"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-12 pr-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all"
              />
            </div>
          </div>

          {/* Last Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Last Name
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">
                badge
              </span>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="e.g. Dela Cruz"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-12 pr-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          {/* Info strip */}
          <div className="bg-tertiary-fixed/30 border-l-4 border-tertiary p-3 rounded-r-lg flex gap-3 text-xs text-on-tertiary-fixed-variant">
            <span className="material-symbols-outlined text-tertiary text-base shrink-0">info</span>
            A QR code will be generated with your plate number, full name, and registration timestamp.
          </div>

          <button
            type="submit"
            className="w-full bg-tertiary text-on-tertiary font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all mt-2 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">qr_code</span>
            Generate My QR Code
          </button>
        </form>
      </main>
    </div>
  );
}
