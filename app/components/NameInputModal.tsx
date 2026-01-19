'use client';

import { useState, useEffect, useRef } from 'react';

interface NameInputModalProps {
  isOpen: boolean;
  score: number;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

export default function NameInputModal({ isOpen, score, onSubmit, onClose }: NameInputModalProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      setName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-bounce-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🏆</div>
          <h2 id="modal-title" className="text-3xl font-bold text-purple-600 mb-2">
            Top 10 Score!
          </h2>
          <p className="text-xl text-gray-700">
            You scored <span className="font-bold text-purple-600">{score}</span> points!
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="player-name" className="block text-sm font-semibold text-gray-700 mb-2">
              Enter your name:
            </label>
            <input
              ref={inputRef}
              id="player-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={20}
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 text-lg text-black dark:text-white"
              placeholder="Enter your name"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{name.length}/20 characters</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              Save Score
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
