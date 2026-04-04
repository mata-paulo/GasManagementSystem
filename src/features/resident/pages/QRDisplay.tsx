import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { encodeQR } from "@/lib/qr/qrCodec";

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function QRDisplay({ resident, onDone }) {
  const { firstName, lastName, plate, barangay, vehicleType, gasType, registeredAt } = resident;
  const fullName = `${firstName} ${lastName}`;
  const qrData = encodeQR(firstName, lastName, registeredAt, gasType);

  const cardRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const handleDownload = async () => {
    if (!captureRef.current) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `AGAS_QR_${plate}.png`;
      a.click();
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <>
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-card { display: block !important; position: fixed; inset: 0; z-index: 9999; }
        }
        .print-card { display: none; }
      `}</style>

      {/* ── Hidden branded capture card (used for Save as Image) ── */}
      <div
        ref={captureRef}
        style={{ position: "fixed", top: "-9999px", left: 0, width: 400, background: "#ffffff", fontFamily: "sans-serif" }}
      >
        {/* Navy header */}
        <div style={{ background: "#001e40", padding: "20px 24px", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", margin: "0 0 4px" }}>A.G.A.S · Gas Allocation QR</p>
          <p style={{ color: "#ffffff", fontWeight: 900, fontSize: 30, letterSpacing: 6, textTransform: "uppercase", margin: 0 }}>{plate}</p>
          {gasType && (
            <p style={{ color: "#fde047", fontWeight: 700, fontSize: 13, marginTop: 6, marginBottom: 0 }}>⛽ {gasType}</p>
          )}
        </div>
        {/* QR + info */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <QRCodeSVG value={qrData} size={280} level="H" marginSize={2} fgColor="#001e40" bgColor="#ffffff" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
            {[
              { label: "Full Name",   value: fullName },
              { label: "Plate No.",   value: plate },
              { label: "Vehicle",     value: vehicleType },
              { label: "Barangay",    value: barangay },
              ...(gasType ? [{ label: "Fuel Type", value: gasType }] : []),
              { label: "Registered",  value: formatTimestamp(registeredAt) },
            ].map((d) => (
              <div key={d.label} style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 12px" }}>
                <p style={{ fontSize: 8, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 2px" }}>{d.label}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#001e40", margin: 0 }}>{d.value}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Footer */}
        <div style={{ background: "#f1f5f9", padding: "10px 24px", textAlign: "center", borderTop: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 9, color: "#94a3b8", margin: 0 }}>© 2026 Mata Technologies Inc. · A.G.A.S — Access to Goods and Assistance System</p>
        </div>
      </div>

      {/* ── Hidden print-only card ── */}
      <div className="print-card bg-white p-8 flex flex-col items-center gap-4">
        <p style={{ fontWeight: 900, fontSize: 22, letterSpacing: 4, color: "#001e40" }}>{plate}</p>
        <QRCodeSVG value={qrData} size={300} level="H" marginSize={2} fgColor="#001e40" bgColor="#ffffff" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%" }}>
          {[
            { label: "Full Name", value: fullName },
            { label: "Plate No.", value: plate },
            { label: "Vehicle",   value: vehicleType },
            { label: "Barangay",  value: barangay },
            ...(gasType ? [{ label: "Fuel Type", value: gasType }] : []),
          ].map((d) => (
            <div key={d.label} style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 12px" }}>
              <p style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{d.label}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#001e40" }}>{d.value}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>© 2026 Mata Technologies Inc. · A.G.A.S</p>
      </div>

      {/* ── Main UI ── */}
      <div className="flex flex-col h-dvh bg-primary-container overflow-hidden">

        {/* Header */}
        <div className="shrink-0 px-5 py-7 text-center">
          <p className="text-on-primary-container text-sm font-bold uppercase tracking-widest mb-1.5 opacity-70">
            A.G.A.S QR Code
          </p>
          <h1 className="font-headline font-black text-white text-5xl tracking-[0.15em] uppercase leading-tight">
            {plate}
          </h1>
          {gasType && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="material-symbols-outlined text-yellow-300 icon-filled text-[22px]">local_gas_station</span>
              <p className="text-white font-bold text-lg tracking-wide">{gasType}</p>
            </div>
          )}
        </div>

        {/* White card */}
        <div className="flex-1 min-h-0 bg-background rounded-t-3xl flex flex-col overflow-hidden">

          {/* Capturable card — QR fixed, info scrollable below */}
          <div ref={cardRef} className="bg-white mx-4 mt-4 rounded-2xl shadow-md flex flex-col overflow-hidden">

            {/* QR — fixed, never scrolls */}
            <div className="shrink-0 flex justify-center pt-4 pb-2 px-4">
              <QRCodeSVG
                value={qrData}
                size={Math.min(window.innerWidth - 16, 380)}
                level="H"
                marginSize={1}
                fgColor="#001e40"
                bgColor="#ffffff"
              />
            </div>

            {/* Info */}
            <div className="px-4 pb-3 flex flex-col gap-2">
              <div className="w-full grid grid-cols-2 gap-2">
                {[
                  { label: "Full Name",  value: fullName },
                  { label: "Plate No.", value: plate },
                  { label: "Vehicle",   value: vehicleType },
                  { label: "Barangay",  value: barangay },
                  ...(gasType ? [{ label: "Fuel Type", value: gasType }] : []),
                  { label: "Registered", value: formatTimestamp(registeredAt) },
                ].map((d) => (
                  <div key={d.label} className="bg-slate-50 rounded-xl px-3 py-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{d.label}</p>
                    <p className="text-xs font-bold text-slate-800 leading-tight">{d.value}</p>
                  </div>
                ))}
              </div>

              {/* Tip — inside the card, below info fields */}
              <div className="bg-tertiary-fixed/30 border-l-4 border-tertiary px-3 py-2 rounded-r-xl flex gap-2 items-start">
                <span className="material-symbols-outlined text-tertiary shrink-0 text-[13px]">info</span>
                <p className="text-[10px] text-on-tertiary-fixed-variant leading-relaxed">
                  Show this QR at any participating station for fuel allocation. Download or print to save.
                </p>
              </div>

              <p className="text-[9px] text-slate-300 text-center">© 2026 Mata Technologies Inc. · A.G.A.S</p>
            </div>
          </div>

          {/* Buttons — pinned to bottom */}
          <div className="mt-auto shrink-0 px-4 pt-2 pb-5 bg-background border-t border-outline-variant/20 flex flex-col gap-2">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={saving}
                className="flex-1 bg-primary-container text-white font-headline font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                <span className="material-symbols-outlined icon-base">{saving ? "hourglass_top" : "download"}</span>
                {saving ? "Saving…" : "Save as Image"}
              </button>
              <button
                type="button"
                onClick={onDone}
                className="flex-1 bg-surface-container-high text-on-surface-variant font-headline font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined icon-base text-[18px]">home</span>
                Back to Home
              </button>
            </div>
            <p className="text-center text-outline text-[9px]">© 2026 Mata Technologies Inc. · A.G.A.S</p>
          </div>
        </div>
      </div>
    </>
  );
}

