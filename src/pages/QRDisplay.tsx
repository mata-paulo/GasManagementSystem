import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { encodeQR } from "../utils/qrCodec";

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function QRDisplay({ resident, onDone }) {
  const { firstName, lastName, plate, barangay, vehicleType, gasType, registeredAt } = resident;
  const fullName = `${firstName} ${lastName}`;

  // New encoded format: JOHSMI46111.8560
  const qrData = encodeQR(firstName, lastName, registeredAt, gasType);

  const svgRef = useRef(null);

  const handleDownload = () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const blob = new Blob([serializer.serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FuelRationingSystem_${plate}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-dvh bg-primary-container overflow-hidden">

      {/* Header */}
      <div className="shrink-0 px-5 py-[8%] text-center">
        <p className="text-on-primary-container text-[11px] font-bold uppercase tracking-widest mb-2 opacity-70">
          A.G.A.S QR Code
        </p>
        <h1 className="font-headline font-black text-white text-4xl tracking-[0.15em] uppercase leading-tight">
          {plate}
        </h1>
        {gasType && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="material-symbols-outlined text-yellow-300 icon-filled text-[20px]">local_gas_station</span>
            <p className="text-white font-bold text-base tracking-wide">{gasType}</p>
          </div>
        )}
      </div>

      {/* White card */}
      <div className="flex-1 bg-background rounded-t-3xl flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col px-5 pt-5 pb-3 gap-4 min-h-0 overflow-y-auto">

          {/* QR code */}
          <div ref={svgRef} className="bg-white rounded-2xl shadow-md p-5 w-full flex justify-center">
            <QRCodeSVG
              value={qrData}
              size={Math.min(window.innerWidth - 96, 300)}
              level="H"
              marginSize={0}
              fgColor="#001e40"
              bgColor="#ffffff"
              className="w-full h-auto"
            />
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-surface-container-low rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold text-outline uppercase tracking-wider mb-0.5">Full Name</p>
              <p className="text-sm font-bold text-on-surface leading-tight">{fullName}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold text-outline uppercase tracking-wider mb-0.5">Plate No.</p>
              <p className="text-sm font-bold text-on-surface tracking-widest">{plate}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold text-outline uppercase tracking-wider mb-0.5">Vehicle</p>
              <p className="text-sm font-bold text-on-surface capitalize">{vehicleType}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold text-outline uppercase tracking-wider mb-0.5">Barangay</p>
              <p className="text-sm font-bold text-on-surface leading-tight">{barangay}</p>
            </div>
            {gasType && (
              <div className="bg-surface-container-low rounded-xl px-4 py-3">
                <p className="text-[9px] font-bold text-outline uppercase tracking-wider mb-0.5">Fuel Type</p>
                <p className="text-sm font-bold text-on-surface">{gasType}</p>
              </div>
            )}
            <div className="bg-surface-container-low rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold text-outline uppercase tracking-wider mb-0.5">Registered</p>
              <p className="text-xs font-medium text-on-surface">{formatTimestamp(registeredAt)}</p>
            </div>
          </div>

          {/* Tip */}
          <div className="bg-tertiary-fixed/30 border-l-4 border-tertiary px-3 py-2.5 rounded-r-xl flex gap-2 items-start">
            <span className="material-symbols-outlined text-tertiary shrink-0 text-[14px]">info</span>
            <p className="text-[10px] text-on-tertiary-fixed-variant leading-relaxed">
              Show this QR at any participating station for fuel allocation. Screenshot or download to save.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="shrink-0 px-5 pt-3 pb-6 bg-background border-t border-outline-variant/20 flex flex-col gap-2">
          <div className="flex gap-3">
            <button onClick={handleDownload}
              className="flex-1 bg-primary-container text-white font-headline font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-sm">
              <span className="material-symbols-outlined icon-base">download</span>
              Download QR
            </button>
            <button onClick={onDone}
              className="flex-1 bg-surface-container-high text-on-surface-variant font-headline font-bold py-3.5 rounded-xl active:scale-95 transition-all text-sm">
              Back to Home
            </button>
          </div>
          <p className="text-center text-outline text-[9px]">
            © 2024 Mata Technologies Inc. · A.G.A.S
          </p>
        </div>
      </div>
    </div>
  );
}
