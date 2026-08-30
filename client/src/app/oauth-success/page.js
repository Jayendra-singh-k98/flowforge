"use client";

import { useEffect } from "react";

export default function OAuthSuccessPage() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      // Store token in localStorage (this will trigger storage event in parent window)
      localStorage.setItem("flowforge_token", token);
      localStorage.setItem("oauth_success", "true");
      
      // Close popup window
      window.close();
    } else {
      // No token, close popup
      window.close();
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      {/* Hidden - just processing and closing */}
    </div>
  );
}
