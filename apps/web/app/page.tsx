"use client";

import { useState } from "react";
import Image from "next/image";

function BetterHostLogo({ className = "h-14" }: { className?: string }) {
  return (
    <a
      href="/"
      className={`flex items-center gap-2.5 hover:opacity-90 transition-opacity ${className}`}
    >
      <Image
        src="/logo.png"
        alt="BetterHost Logo"
        width={220}
        height={54}
        className="h-12 sm:h-14 md:h-16 w-auto object-contain scale-110 origin-left"
        priority
      />
    </a>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Subscribed: ${email}`);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <BetterHostLogo />

          <nav className="hidden md:flex items-center gap-10 text-sm font-semibold text-slate-600">
            <a
              href="#features"
              className="hover:text-indigo-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-indigo-600 transition-colors"
            >
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <a
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
            >
              Sign in
            </a>
            <a
              href="/dashboard"
              className="text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-[1.1] mb-6">
            Deploy your projects.{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              Share them with the world.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed mb-10">
            BetterHost makes it effortless to deploy static sites and web
            projects. Upload once, we handle the rest.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
            <a
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <span>Deploy Your Project</span>
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
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
            <a
              href="/dashboard"
              className="text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-6 py-3 rounded-lg shadow-xs transition-all duration-200"
            >
              Open Dashboard
            </a>
          </div>

          {/* Showcase Dashboard Card */}
          <div className="w-full max-w-4xl bg-white border border-slate-100 rounded-2xl shadow-[0_20px_50px_rgba(79,70,229,0.06)] overflow-hidden text-left flex flex-col md:flex-row">
            {/* Mock Dashboard Sidebar */}
            <div className="w-full md:w-60 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 p-6 flex flex-col justify-between gap-8 shrink-0">
              <div className="flex flex-col gap-6">
                <BetterHostLogo className="scale-90 origin-left" />

                <nav className="flex flex-col gap-1">
                  <a
                    href="/login"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-xs text-left"
                  >
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
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    <span>Projects</span>
                  </a>
                  <a
                    href="/login"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-semibold text-xs text-left transition-colors"
                  >
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5"
                      />
                    </svg>
                    <span>Deployments</span>
                  </a>
                </nav>
              </div>
            </div>

            {/* Mock Dashboard Content */}
            <div className="flex-1 p-8">
              <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Projects
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    All your projects in one place.
                  </p>
                </div>
                <a
                  href="/login"
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3 py-2 rounded-lg shadow-sm transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>New Project</span>
                </a>
              </div>

              {/* Project items */}
              <div className="flex flex-col gap-3">
                {/* Item 1 */}
                <a
                  href="/login"
                  className="group flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-white hover:border-slate-200 hover:shadow-xs transition-all duration-200 cursor-pointer"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        my-portfolio
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                        <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                        Production
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      my-portfolio.betterhost.app
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div className="hidden sm:flex flex-col">
                      <span className="text-xs font-semibold text-slate-500">
                        Deployed
                      </span>
                      <span className="text-[11px] text-slate-400">2m ago</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-full border border-emerald-100/50">
                        Successful
                      </span>
                      <svg
                        className="w-4 h-4 text-slate-400 group-hover:text-slate-650 group-hover:translate-x-0.5 transition-all"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </a>

                {/* Item 2 */}
                <a
                  href="/login"
                  className="group flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-white hover:border-slate-200 hover:shadow-xs transition-all duration-200 cursor-pointer"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        ecommerce-website
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                        <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                        Production
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      shop.betterhost.app
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div className="hidden sm:flex flex-col">
                      <span className="text-xs font-semibold text-slate-500">
                        Deployed
                      </span>
                      <span className="text-[11px] text-slate-400">1d ago</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-full border border-emerald-100/50">
                        Successful
                      </span>
                      <svg
                        className="w-4 h-4 text-slate-400 group-hover:text-slate-650 group-hover:translate-x-0.5 transition-all"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </a>

                {/* Item 3 */}
                <a
                  href="/login"
                  className="group flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-white hover:border-slate-200 hover:shadow-xs transition-all duration-200 cursor-pointer"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        landing-page
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                        <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                        Production
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      landing-page.betterhost.app
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div className="hidden sm:flex flex-col">
                      <span className="text-xs font-semibold text-slate-500">
                        Deployed
                      </span>
                      <span className="text-[11px] text-slate-400">3d ago</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-full border border-emerald-100/50">
                        Successful
                      </span>
                      <svg
                        className="w-4 h-4 text-slate-400 group-hover:text-slate-650 group-hover:translate-x-0.5 transition-all"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </a>
              </div>

              {/* View all projects */}
              <div className="mt-5 text-center">
                <a
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group"
                >
                  View all projects
                  <svg
                    className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section
        id="features"
        className="py-24 bg-white border-y border-slate-100 px-6"
      >
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold shadow-xs mb-4">
            Everything you need
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 text-center max-w-xl leading-tight mb-16">
            Built for speed. Loved by everyone.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            {/* Card 1 */}
            <div className="flex flex-col gap-4 p-6 rounded-2xl border border-slate-100 hover:border-slate-200/80 hover:shadow-[0_10px_30px_rgba(79,70,229,0.03)] hover:-translate-y-0.5 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-slate-900">
                Super fast deployments
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                From upload to live in seconds. No complex configuration or
                pipelines.
              </p>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col gap-4 p-6 rounded-2xl border border-slate-100 hover:border-slate-200/80 hover:shadow-[0_10px_30px_rgba(79,70,229,0.03)] hover:-translate-y-0.5 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-slate-900">
                Global edge hosting
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Your sites are served from the nearest edge location, ensuring
                optimal latency.
              </p>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col gap-4 p-6 rounded-2xl border border-slate-100 hover:border-slate-200/80 hover:shadow-[0_10px_30px_rgba(79,70,229,0.03)] hover:-translate-y-0.5 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <svg
                  className="w-5 h-5"
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
              </div>
              <h3 className="font-bold text-lg text-slate-900">
                Secure by default
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Every project is completely isolated, TLS encrypted, and
                protected by default.
              </p>
            </div>

            {/* Card 4 */}
            <div className="flex flex-col gap-4 p-6 rounded-2xl border border-slate-100 hover:border-slate-200/80 hover:shadow-[0_10px_30px_rgba(79,70,229,0.03)] hover:-translate-y-0.5 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-slate-900">
                Developer friendly
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Simple and robust APIs, CLI integration, and powerful tooling
                options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-16 pb-12 border-t border-slate-100 px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col gap-4 items-center md:items-start text-center md:text-left">
              <BetterHostLogo />
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
                The simplest way to deploy and host your web projects. Focus on
                building, we&apos;ll handle the rest.
              </p>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-8 text-sm font-semibold text-slate-600">
              <a
                href="#features"
                className="hover:text-indigo-600 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="hover:text-indigo-600 transition-colors"
              >
                How it works
              </a>
              <a
                href="/login"
                className="hover:text-indigo-600 transition-colors"
              >
                Sign in
              </a>
              <a
                href="/dashboard"
                className="hover:text-indigo-600 transition-colors"
              >
                Dashboard
              </a>
            </nav>
          </div>

          <div className="border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400 font-semibold">
              &copy; 2026 BetterHost. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
