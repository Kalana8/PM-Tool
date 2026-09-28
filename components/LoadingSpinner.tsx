'use client';

import React from 'react';

const DOT_COUNT = 8;

// An 8-dot "orbit" spinner (each dot fixed at a decreasing opacity around a
// ring, the whole ring rotated via animate-spin) instead of a single
// rotating arc — matches the loading indicator used elsewhere in the
// product, so page/data loading feels consistent everywhere it appears.
export default function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative h-10 w-10 animate-[spin_0.9s_linear_infinite]">
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * (360 / DOT_COUNT)}deg)` }}>
            <span
              className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-blue-500"
              style={{ opacity: 1 - i * (0.8 / DOT_COUNT) }}
            />
          </div>
        ))}
      </div>
      {label && <p className="text-sm font-medium text-gray-400 dark:text-gray-500">{label}</p>}
    </div>
  );
}
