"use client";

import { useState, useEffect, useRef } from "react";
import { useGameLibraryTranslations } from "@/app/translation-engine";
import { interpolate } from "@/app/lib/utils";

interface NameInputModalProps {
  visible: boolean;
  defaultName?: string;
  onSave: (name: string) => void;
  onClose: () => void;
  score?: number;
}

export default function NameInputModal({
  visible,
  defaultName = "",
  onSave,
  onClose,
  score,
}: NameInputModalProps) {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);
  const { texts } = useGameLibraryTranslations();

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
      setName("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 animate-bounce-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🏆</div>
          <h2
            id="modal-title"
            className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2"
          >
            {texts.congratsMessage}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {texts.achievementMessage}
          </p>
          {score !== undefined && (
            <p className="text-xl text-gray-700 dark:text-gray-300">
              {texts.scoreMessage.includes("{{score}}") ? (
                <>
                  {texts.scoreMessage.split("{{score}}")[0]}
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {score}
                  </span>
                  {texts.scoreMessage.split("{{score}}")[1] ?? ""}
                </>
              ) : (
                interpolate(texts.scoreMessage, { score })
              )}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="player-name"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              {texts.namePrompt}:
            </label>
            <input
              ref={inputRef}
              id="player-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={20}
              className="w-full px-4 py-3 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-lg text-black dark:text-white bg-white dark:bg-gray-700"
              placeholder={texts.namePrompt}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {name.length}/20 {texts.characterCountLabel}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
            >
              {texts.dismissButton}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {texts.submitButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
