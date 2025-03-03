"use client";

import React, { useState, useEffect } from "react";
import { formatDuration } from "@/lib/format-duration";

interface FormattedDurationProps {
  seconds: number;
  className?: string;
}

export function FormattedDuration({ seconds, className = "" }: FormattedDurationProps) {
  const [formatted, setFormatted] = useState<string>("");
  
  useEffect(() => {
    setFormatted(formatDuration(seconds));
  }, [seconds]);
  
  return <span className={className}>{formatted}</span>;
}