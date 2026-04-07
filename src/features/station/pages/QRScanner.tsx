import { useRef, useState, useEffect, useCallback } from "react";
import jsQR from "jsqr";
import { decodeQR, type DecodedQR } from "@/lib/qr/qrCodec";
import Header from "@/shared/components/layout/Header";

interface QRScannerProps {
  onClose: () => void;
  onSuccess: (decoded: DecodedQR) => void;
}

export default function QRScanner({ onClose, onSuccess }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [decoded, setDecoded] = useState<DecodedQR | null>(null);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const processCode = (raw: string) => {
    const result = decodeQR(raw);
    if (!result) {
      setError("Invalid QR code format. Expected format: JOHSMI46111.8560");
      setDecoded(null);
      return false;
    }
    setDecoded(result);
    setError("");
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    redirectTimerRef.current = setTimeout(() => {
      onSuccess(result);
    }, 700);
    return true;
  };

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch {
      setCameraError("Camera access denied. Allow camera permission and try again.");
    }
  }, []);

  // Scan loop
  useEffect(() => {
    if (!cameraReady || decoded) return;

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      if (result) {
        stopCamera();
        processCode(result.data);
        return;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cameraReady, decoded, stopCamera]);

  useEffect(() => {
    if (!decoded) startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="flex flex-col h-dvh bg-[#0a0f1e] overflow-hidden">

      {/* Header */}
      <div className="relative z-50">
        <Header onClose={handleClose} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col px-4 pt-4 pb-4 gap-4 overflow-y-auto">

        {/* Camera view */}
        {!decoded && (
          <>
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {/* Viewfinder overlay */}
              {cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 relative">
                    <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                    <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                    <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                    <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                  </div>
                </div>
              )}
              {!cameraReady && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60">
                  <span className="material-symbols-outlined text-4xl animate-pulse">videocam</span>
                  <p className="text-xs">Starting camera…</p>
                </div>
              )}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <span className="material-symbols-outlined text-4xl text-red-400">no_photography</span>
                  <p className="text-xs text-white/70">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="bg-white text-[#003366] text-xs font-bold px-4 py-2 rounded-lg active:scale-95 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
            {/* Hidden canvas for frame processing */}
            <canvas ref={canvasRef} className="hidden" />
            {cameraReady && (
              <p className="text-center text-white/40 text-xs">Point camera at a QR code to scan automatically</p>
            )}
          </>
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
            <div className="flex items-center gap-2 bg-green-900/40 border border-green-500/30 px-4 py-3 rounded-xl text-green-300 text-sm">
              <span className="material-symbols-outlined text-base shrink-0 icon-filled">check_circle</span>
              QR code decoded successfully
            </div>

            <div className="text-center text-white/60 text-xs pt-1">
              Redirecting to validation...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
