"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function SessionDebug() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cookies, setCookies] = useState("");

  useEffect(() => {
    setCookies(document.cookie);
  }, []);

  return (
    <div className="container mx-auto p-4 prose">
      <h1>Authentication Debugging</h1>
      
      <div className="bg-gray-100 p-4 rounded my-4">
        <h2>Session Status: <code>{status}</code></h2>
        
        {status === "authenticated" ? (
          <div>
            <p className="text-green-600 font-bold">✅ Authenticated</p>
            <pre className="bg-gray-800 text-white p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        ) : status === "loading" ? (
          <p>Loading session...</p>
        ) : (
          <p className="text-red-600 font-bold">❌ Not authenticated</p>
        )}
      </div>

      <h2>Cookies</h2>
      <pre className="bg-gray-800 text-white p-4 rounded overflow-auto max-h-40">
        {cookies || "No cookies found"}
      </pre>
      
      <div className="flex gap-4 my-6">
        <Button
          onClick={() => signIn("google", { callbackUrl: "/api/debug/session" })}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Sign In with Google
        </Button>

        <Button
          onClick={() => {
            document.cookie.split(";").forEach(function(c) {
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            localStorage.clear();
            signOut({ callbackUrl: "/api/debug/session" });
          }}
          className="bg-red-600 hover:bg-red-700"
        >
          Clear All & Sign Out
        </Button>

        <Button
          onClick={() => router.push("/dashboard")}
          className="bg-green-600 hover:bg-green-700"
        >
          Try Dashboard
        </Button>
      </div>

      <div className="bg-yellow-50 p-4 rounded border border-yellow-200 my-4">
        <h3>Authentication Environment</h3>
        <ul>
          <li><strong>Environment:</strong> {process.env.NODE_ENV}</li>
          <li><strong>Hostname:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'server-side'}</li>
        </ul>
      </div>
    </div>
  );
}