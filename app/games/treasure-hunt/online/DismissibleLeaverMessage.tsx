"use client";

import { useState } from "react";

type DismissibleLeaverMessageProps = {
  message?: string | null;
};

export default function DismissibleLeaverMessage({
  message,
}: DismissibleLeaverMessageProps) {
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);
  const isDismissed = Boolean(message && dismissedMessage === message);

  if (!message || isDismissed) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-center relative">
      <button
        onClick={() => setDismissedMessage(message)}
        className="absolute top-2 right-2 text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100 rounded-full p-1 transition-colors"
        aria-label="Dismiss message"
        title="Dismiss message"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <p className="text-yellow-800 font-semibold">⚠️ {message}</p>
      <p className="text-yellow-700 text-sm mt-1">
        Game was reset to lobby. Host can start a new game.
      </p>
    </div>
  );
}
