import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

function formatTimestamp(iso) {
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
  const { firstName, lastName, plate, registeredAt } = resident;
  const fullName = `${firstName} ${lastName}`;

  // QR payload — compact JSON string
  const qrData = JSON.stringify({
    plate,
    firstName,
    lastName,
    registeredAt,
  });

  const svgRef = useRef(null);

  const handleDownload = () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CebuFuelVal_${plate}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-slate-100/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
          <span
            className="material-symbols-outlined text-green-600"
            style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>
        <div>
          <h1 className="text-[#003366] font-headline font-bold text-lg leading-none">
            Registration Successful
          </h1>
          <p className="text-[10px] text-[#003366] font-black uppercase tracking-wider opacity-70">
            Cebu Fuel Val
          </p>
        </div>
      </div>

      <main className="flex-1 px-6 pt-6 pb-12 max-w-md mx-auto w-full flex flex-col items-center">
        {/* Success badge */}
        <div className="w-full bg-gradient-to-br from-[#003366] to-[#001e40] rounded-2xl p-6 text-center mb-6 shadow-xl">
          <p className="text-on-primary-container text-xs font-bold uppercase tracking-widest mb-1">
            Fuel Allocation QR Code
          </p>
          <h2 className="font-headline font-black text-white text-xl">{fullName}</h2>
          <div className="mt-1 inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-1 rounded-full">
            <span className="material-symbols-outlined text-tertiary-fixed" style={{ fontSize: "14px" }}>
              directions_car
            </span>
            <span className="text-white font-bold text-sm tracking-widest">{plate}</span>
          </div>
        </div>

        {/* QR Code card */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col items-center w-full">
          <div ref={svgRef} className="bg-white p-4 rounded-xl shadow-inner">
            <QRCodeSVG
              value={qrData}
              size={220}
              level="H"
              includeMargin={false}
              fgColor="#001e40"
              bgColor="#ffffff"
            />
          </div>

          {/* Resident info below QR */}
          <div className="mt-5 w-full space-y-2 text-center">
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-surface-container-low p-3 rounded-xl">
                <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Name</p>
                <p className="text-sm font-bold text-on-surface">{fullName}</p>
              </div>
              <div className="bg-surface-container-low p-3 rounded-xl">
                <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Plate</p>
                <p className="text-sm font-bold text-on-surface tracking-widest">{plate}</p>
              </div>
            </div>
            <div className="bg-surface-container-low p-3 rounded-xl text-left">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Registered</p>
              <p className="text-sm font-medium text-on-surface">{formatTimestamp(registeredAt)}</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-tertiary-fixed/30 border-l-4 border-tertiary p-4 rounded-r-lg flex gap-3 mt-4 w-full">
          <span className="material-symbols-outlined text-tertiary shrink-0 text-base">info</span>
          <p className="text-xs text-on-tertiary-fixed-variant leading-relaxed">
            Show this QR code at any participating fuel station for allocation verification. Screenshot or download to save it.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full mt-6">
          <button
            onClick={handleDownload}
            className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">download</span>
            Download QR Code
          </button>
          <button
            onClick={onDone}
            className="w-full bg-surface-container-high text-on-surface-variant font-headline font-bold py-4 rounded-xl active:scale-95 transition-all"
          >
            Back to Home
          </button>
        </div>

        <p className="text-center text-outline text-[10px] mt-8">
          © 2024 Cebu City Government · Ref: {plate}-{new Date(registeredAt).getTime()}
        </p>
      </main>
    </div>
  );
}
