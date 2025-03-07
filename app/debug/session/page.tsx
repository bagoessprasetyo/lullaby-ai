// app/debug/session/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function DebugSession() {
  const { data: session, status } = useSession();
  
  useEffect(() => {
    console.log("Session status:", status);
    console.log("Session data:", session);
  }, [session, status]);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Session Debug</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p><strong>Status:</strong> {status}</p>
        <pre className="mt-4 bg-black text-white p-4 rounded overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
    </div>
  );
}