"use client";

import { useState } from "react";
import Image from "next/image";

function BetterHostLogo({ className = "h-11" }: { className?: string }) {
  return (
    <a
      href="/"
      className={`flex items-center gap-2.5 hover:opacity-90 transition-opacity ${className}`}
    >
      <Image
        src="/logo.png"
        alt="BetterHost Logo"
        width={180}
        height={44}
        className="h-11 w-auto object-contain"
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
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <BetterHostLogo />

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
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
              href="#pricing"
              className="hover:text-indigo-600 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#changelog"
              className="hover:text-indigo-600 transition-colors"
            >
              Changelog
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
              className="text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all duration-200"
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
              href="/login"
              className="text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-6 py-3 rounded-lg shadow-xs transition-all duration-200"
            >
              View Documentation
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
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                      />
                    </svg>
                    <span>Domains</span>
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>Settings</span>
                  </a>
                </nav>
              </div>

              {/* Help box */}
              <a
                href="/login"
                className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100/60 text-slate-800 text-[11px] font-medium flex flex-col gap-1 hover:shadow-sm hover:border-indigo-200 transition-all cursor-pointer group"
              >
                <span className="font-semibold text-slate-900">Need help?</span>
                <span className="text-slate-500">Check out our docs</span>
                <span className="flex items-center gap-1 text-indigo-600 mt-1 font-semibold group-hover:gap-2 transition-all">
                  Go to docs
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </span>
              </a>
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
            Built for developers. Loved by everyone.
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

      {/* Trusted By Section */}
      <section className="py-20 bg-slate-50 border-b border-slate-100 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-3">
            Trusted by Developers
          </span>
          <p className="text-sm font-semibold text-slate-500 text-center mb-10">
            Join thousands of developers shipping their projects with
            BetterHost.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-y-6 gap-x-12 opacity-60">
            {/* Logo 1 */}
            <div className="flex items-center gap-1.5 font-bold text-slate-600 hover:text-indigo-600 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
              </svg>
              <span className="text-sm tracking-tight">Acme Corp</span>
            </div>
            {/* Logo 2 */}
            <div className="flex items-center gap-1.5 font-bold text-slate-600 hover:text-indigo-600 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 2 12 22Z" />
              </svg>
              <span className="text-sm tracking-tight">Studio Duo</span>
            </div>
            {/* Logo 3 */}
            <div className="flex items-center gap-1.5 font-bold text-slate-600 hover:text-indigo-600 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-sm tracking-tight">MetaShack</span>
            </div>
            {/* Logo 4 */}
            <div className="flex items-center gap-1.5 font-bold text-slate-600 hover:text-indigo-600 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
              </svg>
              <span className="text-sm tracking-tight">DevKits</span>
            </div>
            {/* Logo 5 */}
            <div className="flex items-center gap-1.5 font-bold text-slate-600 hover:text-indigo-600 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm tracking-tight">ShipFast</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-20 pb-10 border-t border-slate-100 px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Left bio & socials */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <BetterHostLogo />
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
            <div className="flex flex-col gap-4">
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
                  className="hover:text-slate-800 transition-colors"
                >
                  How it works
                </a>
                <a
                  href="#pricing"
                  className="hover:text-slate-800 transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="#changelog"
                  className="hover:text-slate-800 transition-colors"
                >
                  Changelog
                </a>
                <a
                  href="#roadmap"
                  className="hover:text-slate-800 transition-colors"
                >
                  Roadmap
                </a>
              </nav>
            </div>

            {/* Resources Links */}
            <div className="flex flex-col gap-4">
              <span className="font-semibold text-xs text-slate-800 tracking-wider uppercase">
                Resources
              </span>
              <nav className="flex flex-col gap-2.5 text-xs text-slate-500 font-medium">
                <a
                  href="#docs"
                  className="hover:text-slate-800 transition-colors"
                >
                  Documentation
                </a>
                <a
                  href="#guides"
                  className="hover:text-slate-800 transition-colors"
                >
                  Guides
                </a>
                <a
                  href="#api"
                  className="hover:text-slate-800 transition-colors"
                >
                  API Reference
                </a>
                <a
                  href="#status"
                  className="hover:text-slate-800 transition-colors"
                >
                  Status
                </a>
                <a
                  href="#help"
                  className="hover:text-slate-800 transition-colors"
                >
                  Help Center
                </a>
              </nav>
            </div>

            {/* Company Links */}
            <div className="flex flex-col gap-4">
              <span className="font-semibold text-xs text-slate-800 tracking-wider uppercase">
                Company
              </span>
              <nav className="flex flex-col gap-2.5 text-xs text-slate-500 font-medium">
                <a
                  href="#about"
                  className="hover:text-slate-800 transition-colors"
                >
                  About Us
                </a>
                <a
                  href="#blog"
                  className="hover:text-slate-800 transition-colors"
                >
                  Blog
                </a>
                <a
                  href="#careers"
                  className="hover:text-slate-800 transition-colors"
                >
                  Careers
                </a>
                <a
                  href="#privacy"
                  className="hover:text-slate-800 transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#terms"
                  className="hover:text-slate-800 transition-colors"
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
