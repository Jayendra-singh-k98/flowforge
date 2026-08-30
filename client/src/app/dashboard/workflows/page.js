"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getWorkflows, deleteWorkflow } from "@/lib/api";

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getWorkflows();
        setWorkflows( response?.data?.workflows || []);

      } catch (error) {
        console.error( "Load workflows error:", error);

        setError( error.message ||  "Failed to load workflows.");
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();
  }, []);

  const handleDeleteWorkflow = async ( event, workflowId ) => {

    event.preventDefault();
    event.stopPropagation();

    const confirmed = window.confirm( "Are you sure you want to delete this workflow?");

    if (!confirmed) {
      return;
    }

    try {
    
      setDeletingId(workflowId);
      await deleteWorkflow(workflowId);

      setWorkflows((currentWorkflows) =>
        currentWorkflows.filter(
          (workflow) =>
            workflow._id !== workflowId
        )
      );
    } catch (error) {
      console.error( "Delete workflow error:", error);
      alert( error.message || "Failed to delete workflow.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Main */}
      <main className="mx-auto max-w-7xl p-8">
        {/* Page heading */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold">
            Dashboard
          </h2>

          <p className="mt-2 text-slate-400">
            Manage your workflows and automation.
          </p>
        </div>

        {/* Workflows section */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">
                My Workflows
              </h3>

              <p className="text-sm text-slate-400">
                Create and manage your automation
                workflows.
              </p>
            </div>

            <Link
              href="/dashboard/workflows/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium transition hover:bg-blue-700"
            >
              + New Workflow
            </Link>
          </div>

          {/* Loading */}
          {loading && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              Loading workflows...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-xl border border-red-900 bg-red-950/30 p-6 text-center">
              <p className="text-red-400">
                {error}
              </p>

              <button
                onClick={() => window.location.reload() }
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {/* No workflows */}
          {!loading &&
            !error &&
            workflows.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
                <h4 className="text-lg font-semibold">
                  No workflows yet
                </h4>

                <p className="mt-2 text-sm text-slate-400">
                  Create your first workflow to get
                  started.
                </p>

                <Link
                  href="/dashboard/workflows/new"
                  className="mt-5 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
                >
                  + Create Workflow
                </Link>
              </div>
            )}

          {/* Workflow cards */}
          {!loading &&
            !error &&
            workflows.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {workflows.map((workflow) => (
                  <Link
                    key={workflow._id}
                    href={`/dashboard/workflows/${workflow._id}`}
                    className="block"
                  >
                    <WorkflowCard
                      name={workflow.name}
                      status={workflow.status}
                      onDelete={(event) =>
                        handleDeleteWorkflow( event, workflow._id)
                      }
                      deleting={deletingId === workflow._id}
                    />
                  </Link>
                ))}
              </div>
            )}
        </section>
      </main>
    </div>
  );
}

function WorkflowCard({ name, status, onDelete, deleting, }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-slate-600 hover:bg-slate-800">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="truncate font-semibold">
            {name}
          </h4>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs ${
            status?.toLowerCase() === "active"
              ? "bg-green-500/10 text-green-400"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-blue-400">
          Open Workflow →
        </span>

        <button
          onClick={onDelete}
          disabled={deleting}
          className="rounded-lg border border-red-900/50 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-950 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}