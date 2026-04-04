import { useState } from "react";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

type ChangePasswordProps = {
  onSuccess?: () => void;
  onBack?: () => void;
};

export default function ChangePassword({ onSuccess, onBack }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setError("You must be logged in to change your password.");
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, password);
      setDone(true);
      onSuccess?.();
    } catch (err: any) {
      if (err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        setError("Current password is incorrect.");
      } else if (err?.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Failed to change password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-4 pr-12 text-sm text-slate-800 outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10";

  const FormFields = (
    <>
      {/* Current Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
        <div className="relative">
          <input type={showCurrent ? "text" : "password"} value={currentPassword}
            onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
            placeholder="Enter current password" className={inputCls} />
          <button type="button" onClick={() => setShowCurrent((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-xl">{showCurrent ? "visibility_off" : "visibility"}</span>
          </button>
        </div>
      </div>

      {/* New Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Minimum 6 characters" className={inputCls} />
          <button type="button" onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
        <div className="relative">
          <input type={showConfirm ? "text" : "password"} value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            placeholder="Re-enter new password"
            className={`w-full bg-white border rounded-xl py-3.5 pl-4 pr-12 text-sm text-slate-800 outline-none focus:ring-2 ${
              confirmPassword && confirmPassword !== password
                ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                : confirmPassword && confirmPassword === password
                  ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100"
                  : "border-slate-200 focus:border-[#003366] focus:ring-[#003366]/10"
            }`} />
          <button type="button" onClick={() => setShowConfirm((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-xl">{showConfirm ? "visibility_off" : "visibility"}</span>
          </button>
        </div>
        {confirmPassword.length > 0 && (
          <p className={`text-[11px] font-bold flex items-center gap-1 ${confirmPassword === password ? "text-emerald-600" : "text-red-500"}`}>
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              {confirmPassword === password ? "check_circle" : "cancel"}
            </span>
            {confirmPassword === password ? "Passwords match" : "Passwords do not match"}
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          <span className="material-symbols-outlined text-base shrink-0">error</span>
          {error}
        </div>
      )}
    </>
  );

  const SuccessState = (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
        <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: "32px", fontVariationSettings: "'FILL' 1" }}>
          check_circle
        </span>
      </div>
      <p className="text-base font-black text-[#003366] text-center">Password changed successfully!</p>
      <p className="text-sm text-slate-400 text-center">You can now use your new password to log in.</p>
    </div>
  );

  return (
    <>
      {/* ══ MOBILE layout ════════════════════════════════════════════════════════ */}
      <div className="flex flex-col min-h-dvh bg-[#eef2f7] lg:hidden">
        <div className="flex items-center px-6 py-4 bg-white shadow-sm sticky top-0 z-40 relative">
          {onBack && (
            <button type="button" onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-full transition-all active:scale-95 text-[#003366] absolute left-6">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <div className="flex flex-col items-center w-full">
            <h1 className="text-[#003366] font-headline font-bold text-lg leading-none">Change Password</h1>
            <p className="text-[10px] text-[#003366] font-black uppercase tracking-wider opacity-60 mt-0.5">ENTER NEW PASSWORD</p>
          </div>
        </div>

        <main className="flex-1 flex flex-col items-center px-6 pt-12 pb-12 max-w-md mx-auto w-full">
          <div className="w-20 h-20 rounded-[22px] bg-[#003366] flex items-center justify-center shadow-lg mb-6">
            <span className="material-symbols-outlined text-white" style={{ fontSize: "36px", fontVariationSettings: "'FILL' 1" }}>
              lock_reset
            </span>
          </div>
          <h2 className="font-headline font-black text-[#003366] text-2xl mb-1">Change Password</h2>
          <p className="text-sm text-slate-500 text-center mb-8 leading-relaxed">Enter your new password below.</p>

          {done ? SuccessState : (
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              {FormFields}
              <button type="submit" disabled={loading}
                className="w-full bg-[#003366] text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ boxShadow: "0 8px 24px rgba(0,51,102,0.30)" }}>
                {loading ? "Updating…" : "Change Password"}
              </button>
            </form>
          )}
        </main>
      </div>

      {/* ══ DESKTOP layout ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex min-h-dvh flex-col bg-gradient-to-br from-[#003366] via-[#00254d] to-[#001a36]">
        {/* Back button */}
        <div className="px-10 pt-8 pb-4">
          {onBack && (
            <button type="button" onClick={onBack}
              className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-semibold">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back
            </button>
          )}
        </div>

        {/* Card */}
        <div className="flex-1 flex items-start justify-center px-4 pb-12">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md px-10 py-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#003366] flex items-center justify-center shadow-md shrink-0">
                <span className="material-symbols-outlined text-white" style={{ fontSize: "28px", fontVariationSettings: "'FILL' 1" }}>
                  lock_reset
                </span>
              </div>
              <div>
                <h2 className="font-headline font-black text-[#003366] text-2xl leading-tight">Change Password</h2>
                <p className="text-sm text-slate-400 mt-0.5">Enter your current and new password.</p>
              </div>
            </div>

            {done ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: "32px", fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                </div>
                <p className="text-base font-black text-[#003366] text-center">Password changed successfully!</p>
                <p className="text-sm text-slate-400 text-center">You can now use your new password to log in.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {FormFields}
                <button type="submit" disabled={loading}
                  className="w-full bg-[#003366] text-white font-bold py-3 rounded-lg shadow hover:bg-[#002244] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2">
                  {loading ? "Updating…" : "Change Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
