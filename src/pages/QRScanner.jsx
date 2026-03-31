import { useRef, useState } from "react";
import jsQR from "jsqr";
import Header from "../components/Header";
import { decodeQR, formatDecodedDate } from "../utils/qrCodec";

export default function QRScanner({ onClose, onSuccess }) {
  const fileInputRef = useRef(null);
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [mode, setMode] = useState("scan"); // "scan" | "manual"

  const processCode = (raw) => {
    const result = decodeQR(raw);
    if (!result) {
      setError("Invalid QR code format. Expected format: JOHSMI46111.8560");
      setDecoded(null);
      return false;
    }
    setDecoded(result);
    setError("");
    return true;
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      URL.revokeObjectURL(url);
      if (!result) {
        setError("No QR code found in the image. Try a clearer photo.");
        setDecoded(null);
        return;
      }
      processCode(result.data);
    };
    img.src = url;
    // reset input so same file can be re-uploaded
    e.target.value = "";
  };

  const handleManualDecode = () => {
    if (!manualCode.trim()) {
      setError("Please enter a code.");
      return;
    }
    processCode(manualCode.trim().toUpperCase());
  };

  const handleConfirm = () => {
    if (decoded) onSuccess(decoded);
  };

  return (
    <div className="flex flex-col h-dvh bg-[#0a0f1e] overflow-hidden">

      {/* Header */}
      <div className="relative z-50">
        <Header onClose={onClose} />
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 mx-4 mt-2 bg-white/10 rounded-xl p-1 shrink-0">
        <button
          onClick={() => { setMode("scan"); setDecoded(null); setError(""); }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            mode === "scan" ? "bg-white text-[#003366]" : "text-white/60"
          }`}
        >
          Upload QR Image
        </button>
        <button
          onClick={() => { setMode("manual"); setDecoded(null); setError(""); }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            mode === "manual" ? "bg-white text-[#003366]" : "text-white/60"
          }`}
        >
          Enter Code Manually
        </button>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col px-4 pt-4 pb-4 gap-4 overflow-y-auto">

        {mode === "scan" && !decoded && (
          <>
            {/* Upload zone */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/30 rounded-2xl py-12 text-white/70 hover:border-white/60 hover:text-white transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-5xl text-white/50"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                qr_code_scanner
              </span>
              <div className="text-center">
                <p className="font-bold text-sm text-white">Tap to upload QR image</p>
                <p className="text-xs text-white/50 mt-1">PNG, JPG, or screenshot</p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Format hint */}
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Expected QR Format</p>
              <p className="text-white font-mono text-sm tracking-widest">JOHSMI46111.8560</p>
              <p className="text-white/40 text-[10px] mt-1">
                [First 3 letters] + [Last 3 letters] + [Excel serial date]
              </p>
            </div>
          </>
        )}

        {mode === "manual" && !decoded && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block mb-1.5">
                Enter Encoded QR Code
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="e.g. JOHSMI46111.8560"
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3.5 px-4 text-white font-mono text-sm tracking-widest placeholder:text-white/30 focus:outline-none focus:border-white/50"
              />
            </div>
            <button
              onClick={handleManualDecode}
              className="w-full bg-white text-[#003366] font-headline font-bold py-3.5 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>search</span>
              Decode
            </button>

            {/* Format hint */}
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Format</p>
              <p className="text-white/70 text-[11px] leading-relaxed">
                3 letters of first name + 3 letters of last name + Excel serial timestamp
              </p>
              <p className="text-white font-mono text-xs tracking-widest mt-1">JOHSMI46111.8560</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-900/40 border border-red-500/30 px-4 py-3 rounded-xl text-red-300 text-sm">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            {error}
          </div>
        )}

        {/* Decoded result */}
        {decoded && (
          <div className="space-y-3">
            {/* Success badge */}
            <div className="flex items-center gap-2 bg-green-900/40 border border-green-500/30 px-4 py-3 rounded-xl text-green-300 text-sm">
              <span className="material-symbols-outlined text-base shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              QR code decoded successfully
            </div>

            {/* Decoded card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
              {/* Card header */}
              <div className="bg-[#003366] px-5 py-4">
                <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Decoded QR Data</p>
                <p className="font-mono font-bold text-white text-lg tracking-widest mt-0.5">
                  {decoded.firstCode}<span className="text-yellow-300">{decoded.lastCode}</span>{decoded.serial}
                </p>
              </div>

              <div className="px-5 py-4 space-y-4">
                {/* Name codes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">First Name Code</p>
                    <p className="font-headline font-black text-[#003366] text-2xl tracking-widest">{decoded.firstCode}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">First 3 letters</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Name Code</p>
                    <p className="font-headline font-black text-[#003366] text-2xl tracking-widest">{decoded.lastCode}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">First 3 letters</p>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Registered At</p>
                  <p className="font-bold text-gray-800 text-sm">{formatDecodedDate(decoded.date)}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Serial: {decoded.serial}</p>
                </div>

                {/* Verify reminder */}
                <div className="bg-amber-50 border-l-4 border-amber-400 px-3 py-2.5 rounded-r-xl flex gap-2 items-start">
                  <span className="material-symbols-outlined text-amber-500 shrink-0" style={{ fontSize: "14px" }}>id_card</span>
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    Verify the resident's name matches the code above. Ask for a valid ID to confirm identity.
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <button
              onClick={handleConfirm}
              className="w-full bg-[#003366] text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              Confirm & Validate
            </button>
            <button
              onClick={() => { setDecoded(null); setError(""); setManualCode(""); }}
              className="w-full bg-white/10 text-white font-headline font-bold py-3.5 rounded-xl active:scale-95 transition-all"
            >
              Scan Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
