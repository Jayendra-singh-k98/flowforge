import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { googleAuthUrl } from "@/lib/api";

export default function GoogleButton({ label = "Continue with Google" }) {
  const router = useRouter();

  useEffect(() => {
    // Listen for storage changes (when popup stores token)
    const handleStorageChange = (event) => {
      if (event.key === "oauth_success" && event.newValue === "true") {
        console.log("OAuth successful, token stored");
        // Remove the marker and redirect
        localStorage.removeItem("oauth_success");
        router.push("/dashboard");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [router]);

  const handleClick = () => {
    // Open Google auth in a new window centered on screen
    const width = 500;
    const height = 600;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    
    try {
      const popup = window.open(
        googleAuthUrl(),
        "GoogleAuth",
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      if (!popup) {
        alert("Please allow popups to use Google login");
      }
    } catch (error) {
      console.error("Failed to open Google auth popup:", error);
      alert("Could not open login window. Please try again.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-3 rounded-md border border-slate-700 bg-slate-800/60 py-2.5 font-body text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.33A9 9 0 0 0 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.05l3.02-2.33z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"
        />
      </svg>
      {label}
    </button>
  );
}