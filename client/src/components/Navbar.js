"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-6 text-white">
      <Link href="/" className="text-xl font-semibold">
        FlowForge
      </Link>

      <nav className="flex items-center gap-5">
        <Link href="/" className="text-sm text-slate-400 hover:text-white">
          Home
        </Link>

        {user ? (
          <>
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">
              Dashboard
            </Link>
            <span className="text-sm text-slate-300">{user.name}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm text-slate-400 hover:text-white">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-medium hover:bg-blue-700"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}