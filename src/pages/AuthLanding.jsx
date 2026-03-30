const SEAL_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCbbe-zthaM_t4yu1d8rgLXIXnsVdYAhK4iVpRkY38-T3C0QczupjBJ-hIbKtILZOYmftRglfHQA5ORA67weq_22pWa4Ygb6InCCo-UHuR3fliRnk2eF9uCgMpEbR3rQJErsjiL4xg67xg7yW2azcjHj0PDs3ijssOzkJPftoPzLotreDN2AdpeV_dKBJsIE1cH0t5lBhcNEbd_I77vjTXCG6xCE3bRmNtU_K8qSaqu2wjy1uFx7j1PgRNIJkKp7IiKFMwJgnl1Ev7U";

export default function AuthLanding({ onLogin, onRegister }) {
  return (
    <div className="flex flex-col min-h-dvh bg-primary-container">
      {/* Top decorative area */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8 relative overflow-hidden"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 L20 0 M20 40 L40 20 M0 0 L40 40' stroke='%23ffffff' stroke-width='1' fill='none' opacity='0.05'/%3E%3C/svg%3E\")",
        }}
      >
        {/* Seal */}
        <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center overflow-hidden mb-6 shadow-2xl">
          <img src={SEAL_URL} alt="Cebu City Seal" className="w-full h-full object-cover" />
        </div>

        <p className="text-on-primary-container text-[11px] font-black uppercase tracking-[0.2em] mb-1">
          Official Portal
        </p>
        <h1 className="font-headline font-black text-white text-4xl text-center leading-tight mb-2">
          Cebu Fuel Val
        </h1>
        <p className="text-white/60 text-sm text-center max-w-[260px] leading-relaxed">
          Fuel allocation validation system for Cebu City residents
        </p>

        {/* Decorative fuel icon */}
        <div className="mt-10 w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
          <span
            className="material-symbols-outlined text-tertiary-fixed"
            style={{ fontSize: "40px", fontVariationSettings: "'FILL' 1" }}
          >
            local_gas_station
          </span>
        </div>
      </div>

      {/* Action panel */}
      <div className="bg-background rounded-t-3xl px-6 pt-8 pb-12 space-y-4 shadow-2xl">
        <div className="space-y-1 mb-6">
          <h2 className="font-headline font-extrabold text-primary text-2xl">Get Started</h2>
          <p className="text-on-surface-variant text-sm">
            Login as a station officer or register as a resident.
          </p>
        </div>

        <button
          onClick={onLogin}
          className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined">login</span>
          Station Officer Login
        </button>

        <button
          onClick={onRegister}
          className="w-full bg-surface-container-high text-on-surface font-headline font-bold py-4 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined">person_add</span>
          Resident Registration
        </button>

        <p className="text-center text-[10px] text-outline pt-4">
          © 2024 Cebu City Government · LGU Fuel Management System
        </p>
      </div>
    </div>
  );
}
