interface ResidentAuthLandingProps {
  onBack: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export default function ResidentAuthLanding({ onBack, onLogin, onRegister }: ResidentAuthLandingProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-primary-container">
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8 relative overflow-hidden"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 L20 0 M20 40 L40 20 M0 0 L40 40' stroke='%23ffffff' stroke-width='1' fill='none' opacity='0.05'/%3E%3C/svg%3E\")",
        }}
      >
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center mb-6 shadow-2xl">
          <span
            className="material-symbols-outlined text-yellow-400"
            style={{ fontSize: "52px", fontVariationSettings: "'FILL' 1" }}
          >
            person
          </span>
        </div>

        <p className="text-on-primary-container text-[11px] font-black uppercase tracking-[0.2em] mb-1">
          Resident Portal
        </p>

        <h1 className="font-headline font-black text-white text-4xl text-center leading-tight mb-2">
          Resident Access
        </h1>

        <p className="text-white/60 text-sm text-center max-w-[260px] leading-relaxed">
          Access your fuel allocation and present your QR code at any participating station
        </p>
      </div>

      <div className="bg-background rounded-t-3xl px-6 pt-8 pb-12 space-y-4 shadow-2xl">
        <div className="space-y-1 mb-6">
          <h2 className="font-headline font-extrabold text-primary text-2xl">
            Resident Login
          </h2>
          <p className="text-on-surface-variant text-sm">
            Sign in to your resident account.
          </p>
        </div>

        <button
          onClick={onLogin}
          className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
        >
          Log In
        </button>

        <button
          onClick={onRegister}
          className="w-full bg-tertiary text-on-tertiary font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
        >
          No Account? Register
        </button>

        <p className="text-center text-[10px] text-outline pt-2">
          © 2024 Mata Technologies Inc. · Fuel Rationing System
        </p>
      </div>
    </div>
  );
}
