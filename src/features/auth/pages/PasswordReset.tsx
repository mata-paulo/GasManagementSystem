import { useEffect, useState } from "react";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

interface PasswordResetProps {
  oobCode: string | null;
  onBack: () => void;
}

export default function PasswordReset({ oobCode, onBack }: PasswordResetProps) {
  const [newPassword, setNewPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setError("");
    setDone(false);
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!oobCode) {
      setError("Invalid or missing reset code.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setDone(true);
    } catch {
      setError("Failed to reset password. The link may have expired or already been used.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-4 pr-12 text-sm text-slate-800 outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10";

  const SuccessContent = (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
        <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: "32px", fontVariationSettings: "'FILL' 1" }}>
          check_circle
        </span>
      </div>
      <p className="text-base font-black text-[#003366]">Password reset successfully!</p>
      <p className="text-sm text-slate-400">You can now sign in with your new password.</p>
      <button
        type="button"
        onClick={onBack}
        className="w-full bg-[#003366] text-white font-bold py-3 rounded-lg shadow hover:bg-[#002244] active:scale-95 transition-all text-sm mt-2"
      >
        Back to Sign In
      </button>
    </div>
  );

  const FormContent = (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* New Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
            placeholder="Minimum 6 characters"
            className={inputCls}
          />
          <button type="button" onClick={() => setShowNew((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-xl">{showNew ? "visibility_off" : "visibility"}</span>
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            placeholder="Re-enter new password"
            className={`w-full bg-white border rounded-xl py-3.5 pl-4 pr-12 text-sm text-slate-800 outline-none focus:ring-2 ${
              confirmPassword && confirmPassword !== newPassword
                ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                : confirmPassword && confirmPassword === newPassword
                  ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100"
                  : "border-slate-200 focus:border-[#003366] focus:ring-[#003366]/10"
            }`}
          />
          <button type="button" onClick={() => setShowConfirm((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-xl">{showConfirm ? "visibility_off" : "visibility"}</span>
          </button>
        </div>
        {confirmPassword.length > 0 && (
          <p className={`text-[11px] font-bold flex items-center gap-1 ${confirmPassword === newPassword ? "text-emerald-600" : "text-red-500"}`}>
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              {confirmPassword === newPassword ? "check_circle" : "cancel"}
            </span>
            {confirmPassword === newPassword ? "Passwords match" : "Passwords do not match"}
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          <span className="material-symbols-outlined text-base shrink-0">error</span>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#003366] text-white font-bold py-3 rounded-lg shadow hover:bg-[#002244] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2"
      >
        {loading ? "Updating…" : "Update Password"}
      </button>
    </form>
  );

  return (
    <>
      {/* ══ MOBILE layout ════════════════════════════════════════════════════════ */}
      <div className="flex flex-col min-h-dvh bg-[#eef2f7] lg:hidden">
        <div className="flex items-center px-6 py-4 bg-white shadow-sm sticky top-0 z-40 relative">
          <button type="button" onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-all active:scale-95 text-[#003366] absolute left-6">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col items-center w-full">
            <h1 className="text-[#003366] font-headline font-bold text-lg leading-none">Reset Password</h1>
            <p className="text-[10px] text-[#003366] font-black uppercase tracking-wider opacity-60 mt-0.5">ENTER A NEW PASSWORD</p>
          </div>
        </div>

        <main className="flex-1 flex flex-col items-center px-6 pt-12 pb-12 max-w-md mx-auto w-full">
          <div className="w-20 h-20 rounded-[22px] bg-[#003366] flex items-center justify-center shadow-lg mb-6">
            <span className="material-symbols-outlined text-white" style={{ fontSize: "36px", fontVariationSettings: "'FILL' 1" }}>
              lock_reset
            </span>
          </div>
          <h2 className="font-headline font-black text-[#003366] text-2xl mb-1">Reset Password</h2>
          <p className="text-sm text-slate-500 text-center mb-8 leading-relaxed">Enter your new password below.</p>

          {done ? SuccessContent : FormContent}
        </main>
      </div>

      {/* ══ DESKTOP layout ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex min-h-dvh flex-col bg-gradient-to-br from-[#003366] via-[#00254d] to-[#001a36]">
        {/* Back button */}
        <div className="px-10 pt-8 pb-4">
          <button type="button" onClick={onBack}
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back
          </button>
        </div>

        {/* Card */}
        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md px-10 py-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#003366] flex items-center justify-center shadow-md shrink-0">
                <span className="material-symbols-outlined text-white" style={{ fontSize: "28px", fontVariationSettings: "'FILL' 1" }}>
                  lock_reset
                </span>
              </div>
              <div>
                <h2 className="font-headline font-black text-[#003366] text-2xl leading-tight">Reset Password</h2>
                <p className="text-sm text-slate-400 mt-0.5">Enter your new password below.</p>
              </div>
            </div>

            {done ? SuccessContent : FormContent}
          </div>
        </div>
      </div>
    </>
  );
}
