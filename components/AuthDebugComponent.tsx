"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthDebugComponent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  // Get auth-related parameters
  const callbackUrl = searchParams.get("callbackUrl");
  const error = searchParams.get("error");

  useEffect(() => {
    // Collect auth debugging information
    const info = {
      authStatus: status,
      hasSession: !!session,
      hasCallbackUrl: !!callbackUrl,
      callbackUrl,
      error,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Log to console for server-side visibility
    console.log("[AUTH DEBUG CLIENT]", info);
    
    // Update state for display
    setDebugInfo(info);
    
    // Save to localStorage for persistence
    try {
      const history = JSON.parse(localStorage.getItem("authDebugHistory") || "[]");
      history.push(info);
      // Keep only the last 10 entries
      if (history.length > 10) history.shift();
      localStorage.setItem("authDebugHistory", JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save debug info to localStorage", e);
    }
  }, [session, status, callbackUrl, error]);

  // Only show in development or with query param
  if (process.env.NODE_ENV !== "development" && !searchParams.get("debug")) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-lg bg-white p-4 border border-gray-300 rounded-lg shadow-lg z-50 text-xs">
      <h3 className="font-bold text-sm mb-2">Auth Debug Info</h3>
      <div className="overflow-auto max-h-60">
        <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => router.push("/")}
          className="px-2 py-1 bg-gray-200 rounded text-xs"
        >
          Home
        </button>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-2 py-1 bg-gray-200 rounded text-xs"
        >
          Dashboard
        </button>
        {callbackUrl && (
          <button
            onClick={() => router.push(callbackUrl)}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
          >
            Go to {callbackUrl}
          </button>
        )}
      </div>
    </div>
  );
}