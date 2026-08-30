"use client";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-900">
      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-28 text-center">
        {/* Signature: three forged nodes, one continuous flow — swap freely */}
        <svg
          width="220"
          height="120"
          viewBox="0 0 220 120"
          fill="none"
          className="mb-10"
          aria-hidden="true"
        >
          <path
            d="M20 90 L90 30 L150 70 L200 20"
            stroke="var(--flow)"
            strokeWidth="2"
            strokeLinecap="round"
            className="flow-path"
            opacity="0.85"
          />
          <circle cx="20" cy="90" r="5" fill="var(--forge)" />
          <circle cx="90" cy="30" r="5" fill="var(--forge)" />
          <circle cx="150" cy="70" r="5" fill="var(--forge)" />
          <circle cx="200" cy="20" r="5" fill="var(--forge)" />
        </svg>

        <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-100 sm:text-5xl">
          Forge your workflows.
          <br />
          <span className="text-amber-400">Watch them flow.</span>
        </h1>

        <p className="mt-5 max-w-xl font-body text-base text-slate-400">
          FlowForge is a placeholder pitch — swap this copy and layout for whatever
          the product actually does. The navbar, auth, and dashboard shell underneath
          are ready to go.
        </p>

        <div className="mt-9 flex items-center gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-amber-500 px-5 py-2.5 font-body text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-md bg-amber-500 px-5 py-2.5 font-body text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-slate-700 px-5 py-2.5 font-body text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}