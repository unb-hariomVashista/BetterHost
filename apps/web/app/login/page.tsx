"use client";

import { useState } from "react";
import Image from "next/image";
import { loginUser } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginUser({ email, password });
      if (res.token) {
        localStorage.setItem("betterhost_token", res.token);
        localStorage.setItem("betterhost_user", JSON.stringify(res.user));
      }
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Top Navbar */}
      <header className="w-full border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Image
              src="/logo.png"
              alt="BetterHost Logo"
              width={180}
              height={44}
              className="h-10 w-auto object-contain"
              priority
            />
          </a>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:inline">
              Don&apos;t have an account?
            </span>
            <a
              href="/register"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-200 hover:border-indigo-300 px-4 py-2 rounded-lg transition-all duration-200"
            >
              Sign up
            </a>
          </div>
        </div>
      </header>

      {/* Main Split Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col lg:flex-row gap-16 items-center">
        {/* Left Side: Welcome Info */}
        <div className="flex-1 flex flex-col gap-10 max-w-xl text-left">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Welcome back <br />
              to{" "}
              <span className="bg-indigo-600 bg-clip-text text-transparent">
                BetterHost
              </span>
            </h1>
            <p className="text-base text-slate-500 max-w-md">
              Log in to your account and continue deploying your projects.
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-6">
            {/* Feature 1 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-55 bg-opacity-10 bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-sm text-slate-800">
                  Fast Deployments
                </h3>
                <p className="text-xs text-slate-450 text-slate-500">
                  Get your projects live in seconds.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-55 bg-opacity-10 bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-sm text-slate-800">
                  Secure by Default
                </h3>
                <p className="text-xs text-slate-450 text-slate-500">
                  Every project is isolated and protected.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-55 bg-opacity-10 bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-sm text-slate-800">
                  Global Edge Network
                </h3>
                <p className="text-xs text-slate-455 text-slate-500">
                  Your sites are served from the nearest edge location.
                </p>
              </div>
            </div>
          </div>

          {/* Decorative 3D stack illustration image */}
          <div className="relative w-full max-w-sm mt-4 hidden md:block">
            <Image
              src="/login_img.png"
              alt="BetterHost 3D Stack Illustration"
              width={380}
              height={300}
              className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-md"
              priority
            />
          </div>
        </div>

        {/* Right Side: Sign-in Form Card */}
        <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-[0_15px_40px_rgba(79,70,229,0.04)] p-8 md:p-10 shrink-0">
          <div className="flex flex-col gap-2 mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in to your account
            </h2>
            <p className="text-xs text-slate-500">
              Welcome back! Please enter your details.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-600 text-left">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 text-left">
              Signed in successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email Address */}
            <div className="flex flex-col gap-1.5 text-left">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-slate-700"
              >
                Email address
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5 text-left">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
                <a
                  href="#forgot"
                  className="text-[11px] font-semibold text-indigo-650 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  <svg
                    className="w-4.5 h-4.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    {showPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    )}
                    {!showPassword && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-semibold text-sm shadow-sm transition-colors cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Social login divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <span className="relative px-3 bg-white text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              or continue with
            </span>
          </div>

          {/* Social login buttons */}
          <div className="flex flex-col gap-3">
            <button className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors cursor-pointer text-slate-700">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors cursor-pointer text-slate-700">
              <svg
                className="w-4.5 h-4.5 text-slate-800"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mt-6 leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="#terms" className="text-slate-500 hover:underline">
              Terms of Service
            </a>{" "}
            <br className="hidden sm:inline" /> and{" "}
            <a href="#privacy" className="text-slate-500 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </main>

      {/* Feature Banner Bar */}
      <div className="w-full max-w-7xl mx-auto px-6 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-white border border-slate-100 shadow-[0_10px_35px_rgba(79,70,229,0.02)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-650 flex items-center justify-center">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-slate-800">
                No credit card required
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Get started for free.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:border-x border-slate-100 md:px-6">
            <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-650 flex items-center justify-center">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-slate-800">
                Unlimited deployments
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Deploy as much as you want.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-650 flex items-center justify-center">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-slate-800">
                Developer support
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                We&apos;re here to help you.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white pt-20 pb-10 border-t border-slate-100 px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Left bio & socials */}
            <div className="lg:col-span-2 flex flex-col gap-6 text-left">
              <a
                href="/"
                className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Image
                  src="/logo.png"
                  alt="BetterHost Logo"
                  width={180}
                  height={44}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </a>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
                The simplest way to deploy and host your web projects. Focus on
                building, we&apos;ll handle the rest.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-4 text-slate-400">
                <a
                  href="#github"
                  className="hover:text-slate-800 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
                <a
                  href="#twitter"
                  className="hover:text-slate-800 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="#discord"
                  className="hover:text-slate-800 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.67 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
                  </svg>
                </a>
                <a
                  href="#linkedin"
                  className="hover:text-slate-800 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="flex flex-col gap-4 text-left">
              <span className="font-semibold text-xs text-slate-800 tracking-wider uppercase">
                Product
              </span>
              <nav className="flex flex-col gap-2.5 text-xs text-slate-500 font-medium">
                <a
                  href="#features"
                  className="hover:text-slate-800 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="hover:text-slate-805 transition-colors"
                >
                  How it works
                </a>
                <a
                  href="#pricing"
                  className="hover:text-slate-805 transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="#changelog"
                  className="hover:text-slate-805 transition-colors"
                >
                  Changelog
                </a>
                <a
                  href="#roadmap"
                  className="hover:text-slate-805 transition-colors"
                >
                  Roadmap
                </a>
              </nav>
            </div>

            {/* Resources Links */}
            <div className="flex flex-col gap-4 text-left">
              <span className="font-semibold text-xs text-slate-800 tracking-wider uppercase">
                Resources
              </span>
              <nav className="flex flex-col gap-2.5 text-xs text-slate-500 font-medium">
                <a
                  href="#docs"
                  className="hover:text-slate-805 transition-colors"
                >
                  Documentation
                </a>
                <a
                  href="#guides"
                  className="hover:text-slate-805 transition-colors"
                >
                  Guides
                </a>
                <a
                  href="#api"
                  className="hover:text-slate-805 transition-colors"
                >
                  API Reference
                </a>
                <a
                  href="#status"
                  className="hover:text-slate-805 transition-colors"
                >
                  Status
                </a>
                <a
                  href="#help"
                  className="hover:text-slate-805 transition-colors"
                >
                  Help Center
                </a>
              </nav>
            </div>

            {/* Company Links */}
            <div className="flex flex-col gap-4 text-left">
              <span className="font-semibold text-xs text-slate-800 tracking-wider uppercase">
                Company
              </span>
              <nav className="flex flex-col gap-2.5 text-xs text-slate-500 font-medium">
                <a
                  href="#about"
                  className="hover:text-slate-805 transition-colors"
                >
                  About Us
                </a>
                <a
                  href="#blog"
                  className="hover:text-slate-805 transition-colors"
                >
                  Blog
                </a>
                <a
                  href="#careers"
                  className="hover:text-slate-805 transition-colors"
                >
                  Careers
                </a>
                <a
                  href="#privacy"
                  className="hover:text-slate-805 transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#terms"
                  className="hover:text-slate-805 transition-colors"
                >
                  Terms of Service
                </a>
              </nav>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="text-xs text-slate-400 font-semibold">
              &copy; 2024 BetterHost. All rights reserved.
            </span>

            <div className="flex items-center gap-6 text-xs text-slate-400 font-semibold">
              <a
                href="#status"
                className="hover:text-slate-600 transition-colors"
              >
                Status
              </a>
              <a
                href="#privacy"
                className="hover:text-slate-600 transition-colors"
              >
                Privacy
              </a>
              <a
                href="#terms"
                className="hover:text-slate-600 transition-colors"
              >
                Terms
              </a>

              <button className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-50 border border-slate-200 text-slate-500 font-semibold hover:bg-slate-100 transition-colors ml-4 cursor-pointer">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                  />
                </svg>
                <span>Light</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
