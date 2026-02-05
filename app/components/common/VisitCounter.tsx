"use client";

import { useEffect, useMemo, useState } from "react";
import { getCurrentDateEST } from "@/app/lib/utils";

interface VisitCounterProps {
  page: string;
}

export default function VisitCounter({ page }: VisitCounterProps) {
  const [visits, setVisits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => getCurrentDateEST(), []);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const response = await fetch(
          `/api/analytics/get-visits?page=${encodeURIComponent(page)}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch visits");
        }

        const data = await response.json();
        setVisits(data.visits);
      } catch (err) {
        console.error("Error fetching visits:", err);
        setError(err instanceof Error ? err.message : "Failed to load visits");
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, [page]);

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Loading visits...
      </div>
    );
  }

  if (error) {
    return null; // Silently fail to not disrupt user experience
  }

  if (visits === null) {
    return null;
  }

  return (
    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      <span>
        {visits.toLocaleString()} {visits === 1 ? "visit" : "visits"} for today
        ({today})
      </span>
    </div>
  );
}
