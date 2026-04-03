import { useState } from "react";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

type ChangePasswordProps = {
  onSuccess?: () => void;
};

export default function ChangePassword({ onSuccess }: ChangePasswordProps) {
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
      // Reauthenticate first — Firebase requires recent login for sensitive operations
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

  return (
    <div className="flex flex-col min-h-dvh bg-[#eef2f7]">
      {/* Header */}
      <div className="flex items-center justify-center px-6 py-4 bg-white shadow-sm sticky top-0 z-40">
        <div className="text-center">
          <h1 className="text-[#003366] font-headline font-bold text-lg leading-none">Reset Password</h1>
          <p className="text-[10px] text-[#003366] font-black uppercase tracking-wider opacity-60 mt-0.5">ENTER NEW PASSWORD</p>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center px-6 pt-12 pb-12 max-w-md mx-auto w-full">
        {/* Icon */}
        <div className="w-20 h-20 rounded-[22px] bg-[#003366] flex items-center justify-center shadow-lg mb-6">
          <span
            className="material-symbols-outlined text-white"
            style={{ fontSize: "36px", fontVariationSettings: "'FILL' 1" }}
          >
            lock_reset
          </span>
        </div>

        <h2 className="font-headline font-black text-[#003366] text-2xl mb-1">Reset Password</h2>
        <p className="text-sm text-slate-500 text-center mb-8 leading-relaxed">
          Enter your new password below.
        </p>

        {done ? (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: "32px", fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <p className="text-base font-black text-[#003366] text-center">Password changed successfully!</p>
            <p className="text-sm text-slate-400 text-center">You can now use your new password to log in.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
                  placeholder="Enter current password"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-4 pr-12 text-sm text-slate-800 outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showCurrent ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-4 pr-12 text-sm text-slate-800 outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
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
                    confirmPassword && confirmPassword !== password
                      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                      : confirmPassword && confirmPassword === password
                        ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100"
                        : "border-slate-200 focus:border-[#003366] focus:ring-[#003366]/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showConfirm ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {/* Inline match indicator */}
              {confirmPassword.length > 0 && (
                <p className={`text-[11px] font-bold flex items-center gap-1 ${confirmPassword === password ? "text-emerald-600" : "text-red-500"}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    {confirmPassword === password ? "check_circle" : "cancel"}
                  </span>
                  {confirmPassword === password ? "Passwords match" : "Passwords do not match"}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#003366] text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ boxShadow: "0 8px 24px rgba(0,51,102,0.30)" }}
            >
              {loading ? "Updating…" : "Change Password"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
