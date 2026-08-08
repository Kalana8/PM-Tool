'use client';

import React from 'react';

interface TimeRangeGridProps {
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:MM
}

const ROW_HEIGHT = 22; // px per hour - compact, for the modal preview
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MAX_DAYS = 14; // guards against a runaway range rendering hundreds of columns
const formatHour = (h: number) => `${h.toString().padStart(2, '0')}:00`;

const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
};

// Noon UTC sidesteps local-timezone day-boundary drift when walking date strings.
const toUtcNoon = (dateStr: string): Date => new Date(`${dateStr}T12:00:00Z`);

const enumerateDates = (startDate: string, endDate: string): string[] => {
  const start = toUtcNoon(startDate);
  const end = toUtcNoon(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return [startDate];
  }
  const days: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end && days.length < MAX_DAYS) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
};

const formatDayLabel = (dateStr: string): string => {
  const d = toUtcNoon(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
};

// MS Teams-style range preview: one column per day spanned by [startDate startTime,
// endDate endTime], with an hour-row background grid and a colored block per day
// showing which hours of that day fall inside the range.
export default function TimeRangeGrid({ startDate, startTime, endDate, endTime }: TimeRangeGridProps) {
  const days = enumerateDates(startDate, endDate);
  const rangeStartMinutes = toMinutes(startTime);
  const rangeEndMinutes = toMinutes(endTime);

  return (
    <div className="flex flex-col h-full min-h-0">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 shrink-0">
        Time Preview
      </p>
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-gray-100 dark:border-gray-900 overflow-hidden">
        {/* Day header row */}
        <div className="flex border-b border-gray-100 dark:border-gray-900 shrink-0">
          <div className="w-10 shrink-0" />
          {days.map((dateStr) => (
            <div
              key={dateStr}
              className="flex-1 min-w-[48px] border-l border-gray-100 dark:border-gray-900 text-center text-[8px] font-bold text-gray-500 dark:text-gray-400 py-1 truncate px-0.5"
            >
              {formatDayLabel(dateStr)}
            </div>
          ))}
        </div>

        {/* Scrollable hour grid */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
          <div className="flex">
            <div className="w-10 shrink-0">
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{ height: ROW_HEIGHT }}
                  className="text-[8px] text-gray-400 font-mono text-right pr-1 -translate-y-1.5"
                >
                  {formatHour(h)}
                </div>
              ))}
            </div>

            {days.map((dateStr, idx) => {
              const isFirstDay = idx === 0;
              const isLastDay = idx === days.length - 1;
              const blockStart = isFirstDay ? rangeStartMinutes : 0;
              const blockEnd = isLastDay ? rangeEndMinutes : 24 * 60;
              const top = (blockStart / 60) * ROW_HEIGHT;
              const height = Math.max(((blockEnd - blockStart) / 60) * ROW_HEIGHT, 0);

              return (
                <div
                  key={dateStr}
                  id={`time-range-grid-day-${dateStr}`}
                  className="relative flex-1 min-w-[48px] border-l border-gray-100 dark:border-gray-900"
                  style={{ height: ROW_HEIGHT * 24 }}
                >
                  {HOURS.map((h) => (
                    <div key={h} style={{ height: ROW_HEIGHT }} className="border-t border-gray-100 dark:border-gray-900/70" />
                  ))}

                  {height > 0 && (
                    <div
                      className="absolute left-0.5 right-0.5 rounded-sm bg-blue-500/80"
                      style={{ top, height }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
