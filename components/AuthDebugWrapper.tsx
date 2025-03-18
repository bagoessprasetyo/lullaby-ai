"use client";

import { Suspense } from "react";
import AuthDebugComponent from "./AuthDebugComponent";

export default function AuthDebugWrapper() {
  return (
    <Suspense fallback={<div className="fixed bottom-4 right-4 p-2 bg-gray-100 rounded text-xs">Loading auth debug...</div>}>
      <AuthDebugComponent />
    </Suspense>
  );
}