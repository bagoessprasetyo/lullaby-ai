"use client";

import React, { useState, useEffect } from "react";

interface ClientDateProps {
  date: string | Date;
  format?: "short" | "long" | "relative";
  className?: string;
}

// This component ensures dates are only rendered client-side
// to prevent hydration mismatches with dates
export function ClientDate({ date, format = "short", className = "" }: ClientDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");
  
  useEffect(() => {
    // Only format the date on the client side
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (format === "short") {
      setFormattedDate(dateObj.toLocaleDateString());
    } else if (format === "long") {
      setFormattedDate(dateObj.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }));
    } else if (format === "relative") {
      // Calculate relative time (today, yesterday, etc)
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        setFormattedDate("Today");
      } else if (diffDays === 1) {
        setFormattedDate("Yesterday");
      } else if (diffDays < 7) {
        setFormattedDate(`${diffDays} days ago`);
      } else {
        setFormattedDate(dateObj.toLocaleDateString());
      }
    }
  }, [date, format]);

  // Return empty span during SSR, then formatted date on client
  return <span className={className}>{formattedDate}</span>;
}