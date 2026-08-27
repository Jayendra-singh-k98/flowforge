"use client";

import Link from "next/link";

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white">

            {/* Header */}
            <header className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
                <h1 className="text-xl font-semibold">
                    FlowForge
                </h1>

                <span className="text-sm text-slate-400">
                    Dashboard
                </span>
            </header>


            {/* Main */}
            <main className="mx-auto max-w-7xl p-8">

                <div className="mb-10">
                    <h2 className="text-3xl font-bold">
                        Dashboard
                    </h2>

                    <p className="mt-2 text-slate-400">
                        Manage and monitor your automation workflows.
                    </p>
                </div>


                {/* Main Dashboard Card */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                    <Link
                        href="/dashboard/workflows"
                        className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-blue-500 hover:bg-slate-800"
                    >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-2xl">
                            ⚡
                        </div>

                        <h3 className="text-lg font-semibold">
                            Workflows
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                            Create, manage and automate your workflows.
                        </p>

                        <p className="mt-5 text-sm text-blue-400">
                            Manage Workflows →
                        </p>
                    </Link>


                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 opacity-70">

                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-2xl">
                            📊
                        </div>

                        <h3 className="text-lg font-semibold">
                            Executions
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                            View workflow execution history and logs.
                        </p>

                        <p className="mt-5 text-sm text-slate-500">
                            Coming soon
                        </p>

                    </div>


                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 opacity-70">

                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 text-2xl">
                            ⚙️
                        </div>

                        <h3 className="text-lg font-semibold">
                            Settings
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                            Configure your FlowForge account and preferences.
                        </p>

                        <p className="mt-5 text-sm text-slate-500">
                            Coming soon
                        </p>

                    </div>

                </div>

            </main>

        </div>
    );
}