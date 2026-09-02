"use client";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

const FEATURES = [
  {
    icon: "⚡",
    color: "text-blue-400 bg-blue-500/10",
    title: "Trigger anything",
    body: "Kick off a workflow manually, on a schedule, or the moment something happens.",
  },
  {
    icon: "🌐",
    color: "text-purple-400 bg-purple-500/10",
    title: "Connect any API",
    body: "Fire off HTTP requests to any service — no glue code, just drop in a node.",
  },
  {
    icon: "✉️",
    color: "text-green-400 bg-green-500/10",
    title: "Notify your team",
    body: "Send emails automatically when a step completes, fails, or needs attention.",
  },
  {
    icon: "🔀",
    color: "text-orange-400 bg-orange-500/10",
    title: "Branch with logic",
    body: "Add conditions so your workflow reacts differently depending on the data.",
  },
];

const STEPS = [
  { n: "01", title: "Add a trigger", body: "Every workflow starts with something that kicks it off." },
  { n: "02", title: "Chain your nodes", body: "Drag in requests, emails, and conditions, then connect them." },
  { n: "03", title: "Save & run", body: "Hit save — your workflow is live and ready to fire." },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="bg-slate-950">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        {/* soft floating glow, purely decorative */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="glow-float absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
          <div
            className="glow-float absolute top-32 right-1/4 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl"
            style={{ animationDelay: "-4s" }}
          />
        </div>

        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-28 text-center">
          <svg
            width="220"
            height="120"
            viewBox="0 0 220 120"
            fill="none"
            className="mb-10 fade-up"
            style={{ animationDelay: "0ms" }}
            aria-hidden="true"
          >
            <path
              d="M20 90 L90 30 L150 70 L200 20"
              stroke="var(--flow, #22d3ee)"
              strokeWidth="2"
              strokeLinecap="round"
              className="flow-path"
              opacity="0.85"
            />
            <circle cx="20" cy="90" r="5" fill="var(--forge, #f59e0b)" className="node-pulse" style={{ animationDelay: "0s" }} />
            <circle cx="90" cy="30" r="5" fill="var(--forge, #f59e0b)" className="node-pulse" style={{ animationDelay: "0.3s" }} />
            <circle cx="150" cy="70" r="5" fill="var(--forge, #f59e0b)" className="node-pulse" style={{ animationDelay: "0.6s" }} />
            <circle cx="200" cy="20" r="5" fill="var(--forge, #f59e0b)" className="node-pulse" style={{ animationDelay: "0.9s" }} />
          </svg>

          <h1
            className="fade-up text-4xl font-semibold tracking-tight text-slate-100 sm:text-5xl"
            style={{ animationDelay: "80ms" }}
          >
            Forge your workflows.
            <br />
            <span className="text-amber-400">Watch them flow.</span>
          </h1>

          <p
            className="fade-up mt-5 max-w-xl text-base text-slate-400"
            style={{ animationDelay: "160ms" }}
          >
            Connect triggers, requests, emails, and conditions on a visual canvas.
            No YAML, no glue scripts — just nodes you can see and reason about.
          </p>

          <div
            className="fade-up mt-9 flex items-center gap-4"
            style={{ animationDelay: "240ms" }}
          >
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-md bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 hover:-translate-y-0.5"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="rounded-md bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 hover:-translate-y-0.5"
                >
                  Get started
                </Link>
                <Link
                  href="/login"
                  className="rounded-md border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:-translate-y-0.5"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="border-t border-slate-900 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-slate-100">
            Four building blocks. Endless workflows.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-slate-400">
            Mix and match nodes to build automations as simple or as involved as you need.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="fade-up rounded-xl border border-slate-800 bg-slate-900 p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-700"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg text-xl ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-slate-100">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="border-t border-slate-900 bg-slate-900/40 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold text-slate-100">
            From idea to automation, in three steps
          </h2>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="fade-up relative pl-4"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <span className="text-3xl font-bold text-slate-800">{s.n}</span>
                <h3 className="mt-2 font-semibold text-slate-100">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section className="border-t border-slate-900 px-6 py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <h2 className="text-2xl font-semibold text-slate-100">
            Ready to forge your first workflow?
          </h2>
          <Link
            href={user ? "/dashboard" : "/register"}
            className="rounded-md bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 hover:-translate-y-0.5"
          >
            {user ? "Open dashboard" : "Create a free account"}
          </Link>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-up {
          opacity: 0;
          animation: fadeUp 0.6s ease-out forwards;
        }

        @keyframes floatGlow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(24px);
          }
        }
        .glow-float {
          animation: floatGlow 9s ease-in-out infinite;
        }

        @keyframes nodePulse {
          0%, 100% {
            r: 5;
            opacity: 1;
          }
          50% {
            r: 6.5;
            opacity: 0.6;
          }
        }
        .node-pulse {
          animation: nodePulse 2.4s ease-in-out infinite;
          transform-origin: center;
        }

        @media (prefers-reduced-motion: reduce) {
          .fade-up,
          .glow-float,
          .node-pulse {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}