import { useEffect, useState } from "react";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

interface PasswordResetProps {
  oobCode: string | null;
  onBack: () => void;
}

export default function PasswordReset({ oobCode, onBack }: PasswordResetProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    } catch (err) {
      setError("Failed to reset password. The link may have expired or already been used.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col min-h-dvh bg-background">
        <div className="flex items-center px-6 py-4 bg-slate-100/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
          <button onClick={onBack} className="p-2 hover:bg-slate-200/50 rounded-full transition-all active:scale-95 text-[#003366]">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col ml-2">
            <h1 className="text-[#003366] font-headline font-bold text-lg leading-none">Password Reset</h1>
            <p className="text-[10px] text-[#003366] font-black uppercase tracking-wider opacity-70">Success</p>
          </div>
        </div>

        <main className="flex-1 px-6 pt-8 pb-12 max-w-md mx-auto w-full">
          <div className="space-y-4 bg-surface-container px-6 py-8 rounded-2xl text-center shadow-lg">
            <span className="material-symbols-outlined text-primary icon-filled text-[48px]">check_circle</span>
            <p className="font-semibold text-on-surface">Password updated</p>
            <p className="text-sm text-on-surface-variant">You can now sign in with your new password.</p>
            <button
              type="button"
              onClick={onBack}
              className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
            >
              Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <div className="flex items-center px-6 py-4 bg-slate-100/80 backdrop-blur-md shadow-sm sticky top-0 z-40 relative">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-200/50 rounded-full transition-all active:scale-95 text-[#003366] absolute left-6"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex flex-col items-center w-full">
          <h1 className="text-[#003366] font-headline font-bold text-2xl leading-none">Reset Password</h1>
          <p className="text-[13px] text-[#003366] font-black uppercase tracking-wider opacity-70">Enter a new password</p>
        </div>
      </div>

      <main className="flex-1 px-6 pt-8 pb-12 max-w-md mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </main>
    </div>
  );
}

