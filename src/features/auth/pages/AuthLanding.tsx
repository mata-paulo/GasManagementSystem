interface AuthLandingProps {
  onLogin: () => void;
  onResidentRegister: () => void;
}

export default function AuthLanding({ onLogin, onResidentRegister }: AuthLandingProps) {
  return (
    <div className="flex min-h-dvh">

      {/* ── Left panel — branding ── */}
      <div className="flex flex-col min-h-dvh w-full lg:w-1/2 bg-primary-container relative overflow-hidden banig-pattern-white">
        {/* Accent circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] rounded-full bg-white/[0.03]" />

        {/* Branding — vertically centered */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-16">
          <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center mb-6 shadow-2xl">
            <span className="material-symbols-outlined text-yellow-400 icon-fill text-[52px]">
              local_gas_station
            </span>
          </div>

          <p className="text-on-primary-container text-[11px] font-black uppercase tracking-[0.2em] mb-1">
            Official Portal
          </p>

          <h1 className="font-headline font-black text-white text-5xl text-center leading-tight mb-3 tracking-[0.1em]">
            A.G.A.S
          </h1>

          <div className="w-12 h-0.5 bg-yellow-400/60 rounded-full mb-4" />

          <p className="text-white/60 text-sm text-center max-w-[260px] leading-relaxed">
            Fuel allocation validation system for Cebu City residents
          </p>
        </div>

        {/* Mobile-only action panel (slides up from bottom) */}
        <div className="relative z-10 lg:hidden bg-background rounded-t-3xl px-6 pt-8 pb-12 space-y-4 shadow-2xl">
          <div className="space-y-1 mb-6">
            <h2 className="font-headline font-extrabold text-primary text-2xl">Get Started</h2>
            <p className="text-on-surface-variant text-sm">Sign in to access your portal.</p>
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
            Register
          </button>

          <p className="text-center text-[10px] text-outline pt-2">
            © 2026 Mata Technologies Inc. · A.G.A.S
          </p>
        </div>
      </div>

      {/* ── Right panel — actions (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-background flex-col items-center justify-center px-16 xl:px-24">
        <div className="w-full max-w-sm">
          <h2 className="font-headline font-extrabold text-[#003366] text-3xl mb-2">
            Get Started
          </h2>
          <p className="text-on-surface-variant text-sm mb-8">
            Sign in or create an account to access your portal.
          </p>

          <div className="space-y-4">
            <button
              onClick={onLogin}
              className="w-full bg-[#003366] text-white font-headline font-bold py-4 rounded-xl shadow-lg hover:bg-[#002244] active:scale-95 transition-all"
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
              Register 
            </button>
          </div>

          <p className="text-center text-[10px] text-outline mt-10">
            © 2026 Mata Technologies Inc. · A.G.A.S
          </p>
        </div>
      </div>

    </div>
  );
}
