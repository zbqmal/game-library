'use client';

import { useEffect, useState } from 'react';

interface CountdownProps {
  start: number;
  show: boolean;
  onComplete: () => void;
}

export default function Countdown({ start, show, onComplete }: CountdownProps) {
  const [count, setCount] = useState(start);

  useEffect(() => {
    if (!show) return;

    if (count === 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCount(count - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, show, onComplete]);

  if (!show || count === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 pointer-events-none">
      <div className="text-9xl font-bold text-white animate-pulse">
        {count}
      </div>
    </div>
  );
}
