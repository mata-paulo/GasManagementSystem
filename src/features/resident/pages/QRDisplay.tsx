import { forwardRef, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { encodeQR } from "@/lib/qr/qrCodec";

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

/** First letter uppercase; if the first character is already uppercase, leave the string unchanged. */
function safeDownloadFileStem(plate: string): string {
  const s = String(plate || "N/A").replace(/[/\\?%*:|"<>]/g, "-").trim();
  return s || "N/A";
}

/** e.g. `AGAS_QR_ABC1236.png` — same for mobile app and desktop portal. */
export function getQRIdentityPngFilename(plate: string): string {
  return `AGAS_QR_${safeDownloadFileStem(plate)}.png`;
}

function formatVehicleTypeDisplay(raw: unknown): string {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  const first = s.charAt(0);
  const isLatinLetter = /[A-Za-z]/.test(first);
  if (isLatinLetter && first === first.toUpperCase()) return s;
  if (isLatinLetter) return first.toLocaleUpperCase("en-US") + s.slice(1);
  return s;
}

/** Single canonical export size so PNG matches on phone app and desktop portal (no extra letterboxing). */
export const QR_IDENTITY_EXPORT_WIDTH_PX = 390;
export const QR_IDENTITY_EXPORT_QR_SIZE = Math.min(QR_IDENTITY_EXPORT_WIDTH_PX - 16, 380);

export type QRIdentityCaptureProps = {
  plate: string;
  vehicleType: string;
  gasType: string;
  registeredAt: string;
  qrData: string;
  /** Defaults to mobile-style sizing (viewport-based). Use `QR_IDENTITY_EXPORT_QR_SIZE` for downloads. */
  qrSize?: number;
  className?: string;
  /** When true, card height fits content only (use for PNG capture — avoids full-viewport blank area). */
  exportLayout?: boolean;
};

/** Same layout as the on-screen A.G.A.S QR card; use with html2canvas for PNG export (resident mobile + portal). */
export const QRIdentityCaptureCard = forwardRef<HTMLDivElement, QRIdentityCaptureProps>(
  function QRIdentityCaptureCard(
    { plate, vehicleType, gasType, registeredAt, qrData, qrSize, className, exportLayout },
    ref,
  ) {
    const resolvedQrSize =
      qrSize ?? (typeof window !== "undefined" ? Math.min(window.innerWidth - 16, 380) : 380);

    const rootClass = exportLayout
      ? "flex h-auto flex-col overflow-visible bg-primary-container"
      : "flex min-h-0 flex-1 flex-col overflow-hidden bg-primary-container";

    const sheetClass = exportLayout
      ? "flex flex-col overflow-visible rounded-t-3xl bg-background"
      : "flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-3xl bg-background";

    const cardClass = exportLayout
      ? "bg-white mx-4 mt-4 flex flex-col overflow-visible rounded-2xl shadow-md"
      : "bg-white mx-4 mt-4 flex min-h-0 flex-col overflow-hidden rounded-2xl shadow-md";

    return (
      <div
        ref={ref}
        style={exportLayout ? { width: QR_IDENTITY_EXPORT_WIDTH_PX } : undefined}
        className={`${rootClass}${className ? ` ${className}` : ""}`}
      >
        <div className="shrink-0 px-5 py-7 text-center">
          <p className="text-on-primary-container text-sm font-bold uppercase tracking-widest mb-1.5 opacity-70">
            A.G.A.S QR Code
          </p>
          <h1 className="font-headline font-black text-white text-5xl tracking-[0.15em] uppercase leading-tight">
            {plate}
          </h1>
          <div className="flex items-center justify-center gap-6 mt-2">
            {vehicleType && (
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-white/80 icon-filled text-[20px]">
                  {vehicleType === "2w" ? "two_wheeler" : "directions_car"}
                </span>
                <p className="text-white/80 font-semibold text-base tracking-wide">
                  {vehicleType === "2w" ? "2W" : vehicleType === "4w" ? "4W" : vehicleType}
                </p>
              </div>
            )}
            {gasType && (
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined icon-filled text-[20px] text-white/80">local_gas_station</span>
                <p className="text-white font-bold text-base tracking-wide">{gasType}</p>
              </div>
            )}
          </div>
        </div>

        <div className={sheetClass}>
          <div className={cardClass}>
            <div className="shrink-0 flex justify-center px-4 pb-2 pt-4">
              <QRCodeSVG
                value={qrData}
                size={resolvedQrSize}
                level="M"
                marginSize={1}
                fgColor="#001e40"
                bgColor="#ffffff"
              />
            </div>

            <div className="flex flex-col gap-2 px-4 pb-3">
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">Registered</p>
                <p className="text-xs font-bold leading-tight text-slate-800">{formatTimestamp(registeredAt)}</p>
              </div>

              <div className="flex gap-2 rounded-r-xl border-l-4 border-tertiary bg-tertiary-fixed/30 px-3 py-2 items-start">
                <span className="material-symbols-outlined shrink-0 text-[13px] text-tertiary">info</span>
                <p className="text-[10px] leading-relaxed text-on-tertiary-fixed-variant">
                  Show this QR at any participating station for fuel allocation. Download or print to save.
                </p>
              </div>

              <p className="text-center text-[9px] text-slate-300">© 2026 Mata Technologies Inc. · A.G.A.S</p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default function QRDisplay({ resident, activeVehicle, onDone }) {
  const { uid, firstName, lastName, barangay, registeredAt } = resident;
  // Use activeVehicle (selected from dashboard) over top-level legacy resident fields
  const plate = activeVehicle?.plate || resident?.plate || "N/A";
  const vehicleType = activeVehicle?.vehicleType || activeVehicle?.type || "";
  const gasType = activeVehicle?.gasType || resident?.gasType || "";
  const fuelAllocation = activeVehicle?.fuelAllocated ?? resident?.fuelAllocation;
  const fuelUsed = activeVehicle?.fuelUsed ?? resident?.fuelUsed;
  const vehicleTypeDisplay = formatVehicleTypeDisplay(vehicleType);
  const fullName = `${firstName} ${lastName}`;
  const qrData = encodeQR(firstName, lastName, registeredAt, gasType, uid, plate, barangay, vehicleType, fuelAllocation, fuelUsed);

  /** Canonical PNG export (fixed size — same file as desktop portal). */
  const pngExportRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const handleDownload = async () => {
    if (!pngExportRef.current) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(pngExportRef.current, {
        scale: 3,
        useCORS: true,
        // Match `primary-container` (#003366) — must match capture root bg so header text stays visible.
        backgroundColor: "#003366",
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = getQRIdentityPngFilename(plate);
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

      {/* ── Hidden print-only card ── */}
      <div className="print-card bg-white p-8 flex flex-col items-center gap-4">
        <p style={{ fontWeight: 900, fontSize: 22, letterSpacing: 4, color: "#001e40" }}>{plate}</p>
        <QRCodeSVG value={qrData} size={300} level="M" marginSize={2} fgColor="#001e40" bgColor="#ffffff" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%" }}>
          {[
            { label: "Full Name", value: fullName },
            { label: "Plate No.", value: plate },
            { label: "Vehicle",   value: vehicleTypeDisplay },
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
        {/* Hidden: PNG export only — same dimensions as desktop portal (no full-screen letterboxing). */}
        <QRIdentityCaptureCard
          ref={pngExportRef}
          exportLayout
          plate={plate}
          vehicleType={vehicleType}
          gasType={gasType}
          registeredAt={registeredAt}
          qrData={qrData}
          qrSize={QR_IDENTITY_EXPORT_QR_SIZE}
          className="fixed -left-[9999px] top-0 z-0 pointer-events-none"
        />

        <QRIdentityCaptureCard
          plate={plate}
          vehicleType={vehicleType}
          gasType={gasType}
          registeredAt={registeredAt}
          qrData={qrData}
        />

        {/* Buttons — outside capture so they never appear in the PNG */}
        <div className="shrink-0 px-4 pt-2 pb-5 bg-background border-t border-outline-variant/20 flex flex-col gap-2">
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
    </>
  );
}

