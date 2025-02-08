'use client';

import { useEffect, useState } from 'react';
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const messages = ["Researching...", "Thinking....", "Pondering..."];

export function CircularProgress({
  size = 120,
  strokeWidth = 4,
  className,
}: CircularProgressProps) {
  const [rotation, setRotation] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Rotate the circle
    const rotationInterval = setInterval(() => {
      setRotation(prev => (prev + 2) % 360);
    }, 10);

    // Change the message every 2 seconds
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 2000);

    return () => {
      clearInterval(rotationInterval);
      clearInterval(messageInterval);
    };
  }, []);

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const dashArray = `${circumference * 0.75} ${circumference * 0.25}`;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        style={{ transform: `rotate(${rotation}deg)` }}
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e0e7ff"
          strokeWidth={strokeWidth}
        />
        {/* Animated circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#4f46e5"
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-green-500 text-sm font-medium">
          {messages[messageIndex]}
        </span>
      </div>
    </div>
  );
} 