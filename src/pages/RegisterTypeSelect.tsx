export default function RegisterTypeSelect({
  onBack,
  onResidentRegister,
  onStationRegister,
}) {
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
            Register
          </h1>
          <p className="text-[10px] text-[#003366] font-black uppercase tracking-wider opacity-70">
            Select Account Type
          </p>
        </div>
      </div>

      <main className="flex-1 px-6 pt-8 pb-12 max-w-md mx-auto w-full">
        <div className="mb-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary-container mx-auto flex items-center justify-center mb-4 shadow-lg">
            <span
              className="material-symbols-outlined text-white"
              style={{ fontSize: "40px", fontVariationSettings: "'FILL' 1" }}
            >
              how_to_reg
            </span>
          </div>

          <h2 className="font-headline font-extrabold text-primary text-2xl">
            What kind of registration?
          </h2>
          <p className="text-on-surface-variant text-sm mt-2">
            Choose whether you want to register as a resident or station.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onResidentRegister}
            className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">person</span>
            Resident Registration
          </button>

          <button
            onClick={onStationRegister}
            className="w-full bg-surface-container-high text-on-surface font-headline font-bold py-4 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-outline-variant"
          >
            <span className="material-symbols-outlined">badge</span>
            Station Registration
          </button>
        </div>
      </main>
    </div>
  );
}