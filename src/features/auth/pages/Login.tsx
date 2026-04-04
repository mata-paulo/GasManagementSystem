import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { login as authLogin, type AuthUser, type Role } from "@/lib/auth/authService";
import { auth } from "@/lib/firebase/client";

interface LoginProps {
  onBack: () => void;
  onSuccess: (user: AuthUser, role: Role) => void;
  onRegister?: () => void;
}

export default function Login({ onBack, onSuccess, onRegister }: LoginProps) {
  const [form, setForm] = useState<{ email: string; password: string }>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [forgotView, setForgotView] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>("");
  const [resetSent, setResetSent] = useState<boolean>(false);
  const [resetLoading, setResetLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    const result = await authLogin({ email: form.email.trim(), password: form.password });
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Login failed.");
      return;
    }
    if (!result.user || !result.role) {
      setError("Login failed. Please try again.");
      return;
    }
    onSuccess(result.user, result.role);
  };

  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const email = resetEmail.trim();
    if (!email) { setError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address."); return; }
    setResetLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true,
      });
    } catch {
      // Intentionally ignored
    } finally {
      setResetLoading(false);
      setResetSent(true);
    }
  };

  const handleBackToLogin = (): void => {
    setForgotView(false);
    setResetSent(false);
    setResetEmail("");
    setError("");
  };

  // ── Mobile layout (unchanged original) ──────────────────────────────────────
  const MobileLayout = (
    <div className="flex flex-col min-h-dvh bg-background lg:hidden">
      <div className="flex items-center px-6 py-4 bg-slate-100/80 backdrop-blur-md shadow-sm sticky top-0 z-40 relative">
        <button
          onClick={forgotView ? handleBackToLogin : onBack}
          className="p-2 hover:bg-slate-200/50 rounded-full transition-all active:scale-95 text-[#003366] absolute left-6"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex flex-col items-center w-full">
          <h1 className="text-[#003366] font-headline font-bold text-2xl leading-none">
            {forgotView ? "Reset Password" : "Login"}
          </h1>
          <p className="text-[13px] text-[#003366] font-black uppercase tracking-wider opacity-70">AGAS</p>
        </div>
      </div>

      <main className="flex-1 px-6 pt-8 pb-12 max-w-md mx-auto w-full">
        {!forgotView ? (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-4 shadow-lg">
                <span className="material-symbols-outlined text-white icon-filled text-[40px]">manage_accounts</span>
              </div>
              <h2 className="font-headline font-extrabold text-primary text-2xl">Welcome Back</h2>
              <p className="text-on-surface-variant text-sm text-center mt-1">Enter your account details to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="e.g. juan@gmail.com"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Enter your password"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 pr-12 text-sm" />
                  <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => { setForgotView(true); setError(""); }} className="text-xs font-semibold text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm">
                  <span className="material-symbols-outlined text-base">error</span>{error}
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? "Signing in…" : "Log In"}
              </button>
              {onRegister && (
                <p className="text-center text-xs text-on-surface-variant pt-1">
                  New here?{" "}
                  <button type="button" onClick={onRegister} className="font-semibold text-primary hover:underline">
                    Register for an account
                  </button>
                </p>
              )}
            </form>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-4 shadow-lg">
                <span className="material-symbols-outlined text-white icon-filled text-[40px]">lock_reset</span>
              </div>
              <h2 className="font-headline font-extrabold text-primary text-2xl">Forgot Password</h2>
              <p className="text-on-surface-variant text-sm text-center mt-1">Enter your email and we'll send you a reset link.</p>
            </div>
            {resetSent ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 bg-surface-container px-6 py-8 rounded-2xl text-center">
                  <span className="material-symbols-outlined text-primary icon-filled text-[48px]">mark_email_read</span>
                  <p className="font-semibold text-on-surface">Check your inbox</p>
                  <p className="text-sm text-on-surface-variant">
                    If an account exists for <span className="font-semibold text-on-surface">{resetEmail}</span>, we'll send a password reset link.
                  </p>
                </div>
                <button type="button" onClick={handleBackToLogin}
                  className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email</label>
                  <input type="email" value={resetEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setResetEmail(e.target.value); setError(""); }}
                    placeholder="e.g. juan@gmail.com" className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm" />
                </div>
                {error && (
                  <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm">
                    <span className="material-symbols-outlined text-base">error</span>{error}
                  </div>
                )}
                <button type="submit" disabled={resetLoading}
                  className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">
                  {resetLoading ? "Sending…" : "Send Reset Link"}
                </button>
                <button type="button" onClick={handleBackToLogin}
                  className="w-full text-sm font-semibold text-on-surface-variant py-2 active:opacity-70 transition-all">
                  Back to Login
                </button>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );

  // ── Desktop layout (card style matching reference) ───────────────────────────
  const DesktopLayout = (
    <div className="hidden lg:flex min-h-dvh items-center justify-center relative bg-gradient-to-br from-[#003366] via-[#00254d] to-[#001a36]">
      {/* Back button */}
      <button
        onClick={forgotView ? handleBackToLogin : onBack}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back
      </button>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 px-10 py-10">
        {!forgotView ? (
          <>
            {/* Logo */}
            <div className="flex flex-col items-center mb-7">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#003366] icon-fill text-[36px]">local_gas_station</span>
                <span className="font-headline font-black text-[#003366] text-2xl tracking-widest">A.G.A.S.</span>
              </div>
              <h2 className="text-[#003366] font-bold text-lg mt-2">Secure Portal Access</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#003366]/70 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder=""
                  autoComplete="email"
                  className="w-full border-0 border-b-2 border-[#003366] bg-transparent py-2 text-sm text-[#003366] placeholder-transparent focus:outline-none focus:border-[#003366]"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-[#003366]/70 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder=""
                    autoComplete="current-password"
                    className="w-full border-0 border-b-2 border-[#003366] bg-transparent py-2 pr-8 text-sm text-[#003366] placeholder-transparent focus:outline-none focus:border-[#003366]"
                  />
                  <button type="button" onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[#003366]/50 hover:text-[#003366]">
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-xs">
                  <span className="material-symbols-outlined text-base">error</span>{error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-[#003366] text-white font-bold py-3 rounded-lg shadow hover:bg-[#002244] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm">
                {loading ? "Signing in…" : "Login to Dashboard"}
              </button>
            </form>

            {/* Footer links */}
            <div className="flex items-center justify-center gap-1 mt-5 text-xs">
              <button type="button" onClick={() => { setForgotView(true); setError(""); }}
                className="text-yellow-600 hover:underline font-medium">
                Problem signing in?
              </button>
              {onRegister && (
                <>
                  <span className="text-gray-300">|</span>
                  <button type="button" onClick={onRegister}
                    className="text-yellow-600 hover:underline font-medium">
                    Register for an account
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Forgot password — desktop card */}
            <div className="flex flex-col items-center mb-7">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#003366] icon-fill text-[36px]">local_gas_station</span>
                <span className="font-headline font-black text-[#003366] text-2xl tracking-widest">A.G.A.S.</span>
              </div>
              <h2 className="text-[#003366] font-bold text-lg mt-2">
                {resetSent ? "Email Sent" : "Reset Password"}
              </h2>
            </div>

            {resetSent ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 bg-gray-50 px-4 py-6 rounded-xl text-center">
                  <span className="material-symbols-outlined text-[#003366] icon-filled text-[40px]">mark_email_read</span>
                  <p className="text-sm text-gray-600">
                    If an account exists for <span className="font-semibold text-[#003366]">{resetEmail}</span>, we'll send a reset link.
                  </p>
                </div>
                <button type="button" onClick={handleBackToLogin}
                  className="w-full bg-[#003366] text-white font-bold py-3 rounded-lg text-sm hover:bg-[#002244] active:scale-95 transition-all">
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-[#003366]/70 mb-1">Email address</label>
                  <input type="email" value={resetEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setResetEmail(e.target.value); setError(""); }}
                    className="w-full border-0 border-b-2 border-[#003366] bg-transparent py-2 text-sm text-[#003366] focus:outline-none" />
                </div>
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-xs">
                    <span className="material-symbols-outlined text-base">error</span>{error}
                  </div>
                )}
                <button type="submit" disabled={resetLoading}
                  className="w-full bg-[#003366] text-white font-bold py-3 rounded-lg text-sm hover:bg-[#002244] active:scale-95 transition-all disabled:opacity-60">
                  {resetLoading ? "Sending…" : "Send Reset Link"}
                </button>
                <button type="button" onClick={handleBackToLogin}
                  className="w-full text-xs font-semibold text-gray-400 hover:text-gray-600 py-1 transition-all">
                  Back to Login
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {MobileLayout}
      {DesktopLayout}
    </>
  );
}
