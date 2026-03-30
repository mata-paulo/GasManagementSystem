import { useState } from "react";

export default function ResidentLogin({ onBack, onSuccess }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    plate: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim() || !form.plate.trim()) {
      setError("All fields are required.");
      return;
    }

    onSuccess({
      ...form,
      plate: form.plate.toUpperCase(),
      role: "resident",
      loginAt: new Date().toISOString(),
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
            Resident Login
          </h1>
          <p className="text-[10px] text-[#003366] font-black uppercase tracking-wider opacity-70">
            Cebu Fuel Val
          </p>
        </div>
      </div>

      <main className="flex-1 px-6 pt-8 pb-12 max-w-md mx-auto w-full">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-4 shadow-lg">
            <span
              className="material-symbols-outlined text-white"
              style={{ fontSize: "40px", fontVariationSettings: "'FILL' 1" }}
            >
              person
            </span>
          </div>
          <h2 className="font-headline font-extrabold text-primary text-2xl">
            Welcome Back
          </h2>
          <p className="text-on-surface-variant text-sm text-center mt-1">
            Enter your resident details to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              Plate Number
            </label>
            <input
              type="text"
              name="plate"
              value={form.plate}
              onChange={handleChange}
              placeholder="e.g. ABC-1234"
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
            Log In
          </button>
        </form>
      </main>
    </div>
  );
}