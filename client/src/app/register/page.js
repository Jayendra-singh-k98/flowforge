"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import GoogleButton from "@/components/buttons/GoogleButton";

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Couldn't create your account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-57px)] items-center justify-center bg-slate-900 px-6 ">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-slate-100">
            Create your account
          </h1>
          <p className="font-body text-sm text-slate-400">
            Start forging workflows in minutes.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-6 shadow-xl shadow-black/20">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block font-body text-xs font-medium text-slate-400">
                Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Jayendra Singh"
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 font-body text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-body text-xs font-medium text-slate-400">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 font-body text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-body text-xs font-medium text-slate-400">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 font-body text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-500"
              />
            </div>

            {error && (
              <p className="rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 font-body text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 rounded-md bg-amber-500 py-2.5 font-body text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-800" />
            <span className="font-body text-xs text-slate-500">or</span>
            <span className="h-px flex-1 bg-slate-800" />
          </div>

          <GoogleButton label="Sign up with Google" />
        </div>

        <p className="mt-6 text-center font-body text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-amber-400 hover:text-amber-300">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}