interface CmsAuthLandingProps {
  onBack: () => void;
  onLogin: () => void;
}

export default function CmsAuthLanding({ onBack, onLogin }: CmsAuthLandingProps) {
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
            admin_panel_settings
          </span>
        </div>

        <p className="text-on-primary-container text-[11px] font-black uppercase tracking-[0.2em] mb-1">
          CMS Admin Portal
        </p>

        <h1 className="font-headline font-black text-white text-4xl text-center leading-tight mb-2">
          Admin Access
        </h1>

        <p className="text-white/60 text-sm text-center max-w-[260px] leading-relaxed">
          Manage stations, residents, and system-wide fuel allocation settings
        </p>
      </div>

      <div className="bg-background rounded-t-3xl px-6 pt-8 pb-12 space-y-4 shadow-2xl">
        <div className="space-y-1 mb-6">
          <h2 className="font-headline font-extrabold text-primary text-2xl">
            Admin Login
          </h2>
          <p className="text-on-surface-variant text-sm">
            Restricted access — authorized personnel only.
          </p>
        </div>

        <button
          onClick={onLogin}
          className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
        >
          Log In
        </button>

        <p className="text-center text-[10px] text-outline pt-2">
          © 2024 Mata Technologies Inc. · Fuel Rationing System
        </p>
      </div>
    </div>
  );
}
