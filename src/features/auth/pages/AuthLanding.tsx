interface AuthLandingProps {
  onLogin: () => void;
  onResidentRegister: () => void;
}

export default function AuthLanding({ onLogin, onResidentRegister }: AuthLandingProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-primary-container">
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8 relative overflow-hidden banig-pattern-white"
      >
        <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center mb-6 shadow-2xl">
          <span
            className="material-symbols-outlined text-yellow-400 icon-fill text-[52px]"
          >
            local_gas_station
          </span>
        </div>

        <p className="text-on-primary-container text-[11px] font-black uppercase tracking-[0.2em] mb-1">
          Official Portal
        </p>

        <h1 className="font-headline font-black text-white text-4xl text-center leading-tight mb-2">
          A.G.A.S
        </h1>

        <p className="text-white/60 text-sm text-center max-w-[260px] leading-relaxed">
          Fuel allocation validation system for Cebu City residents
        </p>
      </div>

      <div className="bg-background rounded-t-3xl px-6 pt-8 pb-12 space-y-4 shadow-2xl">
        <div className="space-y-1 mb-6">
          <h2 className="font-headline font-extrabold text-primary text-2xl">
            Get Started
          </h2>
          <p className="text-on-surface-variant text-sm">
            Sign in to access your portal.
          </p>
        </div>

        <button
          onClick={onLogin}
          className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
        >
          Sign In
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-outline-variant" />
          <span className="text-xs text-on-surface-variant">New here?</span>
          <div className="flex-1 h-px bg-outline-variant" />
        </div>

        <button
          onClick={onResidentRegister}
          className="w-full bg-tertiary text-on-tertiary font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
        >
          Register as Resident
        </button>

        <p className="text-center text-[10px] text-outline pt-2">
          © 2026 Mata Technologies Inc. · A.G.A.S
        </p>
      </div>
    </div>
  );
}

