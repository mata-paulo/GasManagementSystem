import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { login as authLogin, type AuthUser, type Role } from "@/lib/auth/authService";
import { auth } from "@/lib/firebase/client";

interface LoginProps {
  onBack: () => void;
  onSuccess: (user: AuthUser, role: Role) => void;
}

export default function Login({ onBack, onSuccess }: LoginProps) {
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
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setResetLoading(true);
    setError("");
    try {
      // Avoid account enumeration: show success UI even if the email doesn't exist.
      const actionCodeSettings = {
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
    } catch {
      // Intentionally ignored (still show the generic success message).
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

  return (
    <div className="flex flex-col min-h-dvh bg-background">
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
          <p className="text-[13px] text-[#003366] font-black uppercase tracking-wider opacity-70">
            AGAS
          </p>
        </div>
      </div>

      <main className="flex-1 px-6 pt-8 pb-12 max-w-md mx-auto w-full">
        {!forgotView ? (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-4 shadow-lg">
                <span className="material-symbols-outlined text-white icon-filled text-[40px]">
                  manage_accounts
                </span>
              </div>
              <h2 className="font-headline font-extrabold text-primary text-2xl">
                Welcome Back
              </h2>
              <p className="text-on-surface-variant text-sm text-center mt-1">
                Enter your account details to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. juan@gmail.com"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 pr-12 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setForgotView(true); setError(""); }}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
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
                {loading ? "Signing in…" : "Log In"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-4 shadow-lg">
                <span className="material-symbols-outlined text-white icon-filled text-[40px]">
                  lock_reset
                </span>
              </div>
              <h2 className="font-headline font-extrabold text-primary text-2xl">
                Forgot Password
              </h2>
              <p className="text-on-surface-variant text-sm text-center mt-1">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {resetSent ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 bg-surface-container px-6 py-8 rounded-2xl text-center">
                  <span className="material-symbols-outlined text-primary icon-filled text-[48px]">
                    mark_email_read
                  </span>
                  <p className="font-semibold text-on-surface">Check your inbox</p>
                  <p className="text-sm text-on-surface-variant">
                    If an account exists for{" "}
                    <span className="font-semibold text-on-surface">{resetEmail}</span>, we’ll send a password reset link.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setResetEmail(e.target.value); setError(""); }}
                    placeholder="e.g. juan@gmail.com"
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
                  className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
                  disabled={resetLoading}
                >
                  {resetLoading ? "Sending…" : "Send Reset Link"}
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full text-sm font-semibold text-on-surface-variant py-2 active:opacity-70 transition-all"
                >
                  Back to Login
                </button>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}

