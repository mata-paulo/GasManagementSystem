interface HeaderProps {
  onClose?: () => void;
}

export default function Header({ onClose }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-100/80 backdrop-blur-md shadow-sm flex justify-between items-center w-full px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-yellow-400 icon-fill text-[22px]">
            local_gas_station
          </span>
        </div>
        <div>
          <h1 className="text-[#003366] font-headline font-bold tracking-tight text-lg leading-none">
            Fuel Rationing System
          </h1>
          <p className="text-[10px] text-[#003366] font-black uppercase tracking-wider opacity-80">
            Official Portal
          </p>
        </div>
      </div>

      {onClose ? (
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-200/50 rounded-full transition-all duration-150 active:scale-95 text-[#003366]"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      ) : (
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200/50 transition-colors active:scale-95 duration-150 text-[#003366]">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      )}
    </header>
  );
}
