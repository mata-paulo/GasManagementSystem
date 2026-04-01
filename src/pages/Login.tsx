import { useState } from "react";
import { login as authLogin } from "../services/authService";
import type { AuthUser, Role } from "../services/authService";

interface LoginProps {
  onBack: () => void;
  onSuccess: (user: AuthUser, token: string | undefined, role: Role | undefined) => void;
}

export default function Login({ onBack, onSuccess }: LoginProps) {
  const [form, setForm] = useState<{ email: string; password: string }>({ email: "", password: "" });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [forgotView, setForgotView] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>("");
  const [resetSent, setResetSent] = useState<boolean>(false);

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
    onSuccess(result.user!, result.token, result.role);
  };

  const handleResetSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setResetSent(true);
    setError("");
  };

  const handleBackToLogin = (): void => {
    setForgotView(false);
    setResetSent(false);
    setResetEmail("");
    setError("");
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <div className="flex items-center gap-3 px-6 py-4 bg-slate-100/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <button
          onClick={forgotView ? handleBackToLogin : onBack}
          className="p-2 hover:bg-slate-200/50 rounded-full transition-all active:scale-95 text-[#003366]"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-[#003366] font-headline font-bold text-lg leading-none">
            {forgotView ? "Reset Password" : "Officer Login"}
          </h1>
          <p className="text-[10px] text-[#003366] font-black uppercase tracking-wider opacity-70">
            Fuel Rationing System
          </p>
        </div>
      </div>

      <main className="flex-1 px-6 pt-8 pb-12 max-w-md mx-auto w-full">
        {!forgotView ? (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-4 shadow-lg">
                <span
                  className="material-symbols-outlined text-white"
                  style={{ fontSize: "40px", fontVariationSettings: "'FILL' 1" }}
                >
                  manage_accounts
                </span>
              </div>
              <h2 className="font-headline font-extrabold text-primary text-2xl">
                Welcome Back
              </h2>
              <p className="text-on-surface-variant text-sm text-center mt-1">
                Enter your officer details to continue.
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
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm"
                />
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
                <span
                  className="material-symbols-outlined text-white"
                  style={{ fontSize: "40px", fontVariationSettings: "'FILL' 1" }}
                >
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
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontSize: "48px", fontVariationSettings: "'FILL' 1" }}
                  >
                    mark_email_read
                  </span>
                  <p className="font-semibold text-on-surface">Check your inbox</p>
                  <p className="text-sm text-on-surface-variant">
                    A password reset link was sent to{" "}
                    <span className="font-semibold text-on-surface">{resetEmail}</span>.
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
                >
                  Send Reset Link
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
