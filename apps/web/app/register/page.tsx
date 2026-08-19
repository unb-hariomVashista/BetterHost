"use client";

import { useState } from "react";
import Image from "next/image";
import { registerUser } from "@/lib/api";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await registerUser({
        firstName,
        lastName,
        email,
        password,
      });

      if (res.token) {
        localStorage.setItem("betterhost_token", res.token);
        localStorage.setItem("betterhost_user", JSON.stringify(res.user));
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.");
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
              Already have an account?
            </span>
            <a
              href="/login"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-200 hover:border-indigo-300 px-4 py-2 rounded-lg transition-all duration-200"
            >
              Sign in
            </a>
          </div>
        </div>
      </header>

      {/* Main Split Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col lg:flex-row gap-16 items-center">
        {/* Left Side: Info */}
        <div className="flex-1 flex flex-col gap-10 max-w-xl text-left">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Create your <br />
              <span className="bg-indigo-600 bg-clip-text text-transparent">
                BetterHost Account
              </span>
            </h1>
            <p className="text-base text-slate-500 max-w-md">
              Start deploying static sites and web projects in seconds with high performance global edge hosting.
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
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
                  Instant Setup
                </h3>
                <p className="text-xs text-slate-500">
                  No credit card required. Free tier forever.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
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
                  Secure & Automated
                </h3>
                <p className="text-xs text-slate-500">
                  Automatic SSL encryption and isolated deployments.
                </p>
              </div>
            </div>
          </div>

          {/* Decorative Image */}
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

        {/* Right Side: Register Form Card */}
        <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-[0_15px_40px_rgba(79,70,229,0.04)] p-8 md:p-10 shrink-0">
          <div className="flex flex-col gap-2 mb-8 text-left">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Create an account
            </h2>
            <p className="text-xs text-slate-500">
              Get started for free. No credit card required.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-600 text-left">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 text-left">
              Account created successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="firstName"
                  className="text-xs font-semibold text-slate-700"
                >
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5 text-left">
                <label
                  htmlFor="lastName"
                  className="text-xs font-semibold text-slate-700"
                >
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5 text-left">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-slate-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5 text-left">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium transition-all"
              />
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5 text-left">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-semibold text-slate-700"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium transition-all"
              />
            </div>

            <div className="flex items-center gap-2 mt-1 text-left">
              <input
                id="showPassword"
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label
                htmlFor="showPassword"
                className="text-xs text-slate-600 cursor-pointer"
              >
                Show passwords
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-semibold text-sm shadow-sm transition-colors cursor-pointer mt-2"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-6 leading-relaxed">
            By creating an account, you agree to our{" "}
            <a href="#terms" className="text-slate-500 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#privacy" className="text-slate-500 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white pt-10 pb-8 border-t border-slate-100 px-6 text-center text-xs text-slate-400">
        &copy; 2024 BetterHost. All rights reserved.
      </footer>
    </div>
  );
}
