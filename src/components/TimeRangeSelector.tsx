'use client';

import { TimeRange } from '@/types';
import { cn } from '@/lib/utils';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const ranges: { value: TimeRange; label: string }[] = [
  { value: 'short_term', label: '4 Weeks' },
  { value: 'medium_term', label: '6 Months' },
  { value: 'long_term', label: 'All Time' },
];

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex space-x-2">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
            value === range.value
              ? 'bg-spotify-green text-black'
              : 'bg-spotify-darkgray text-spotify-lightgray hover:text-white'
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
