"use client";

import { useState } from "react";
import { Input } from "~/components/ui/Input";

interface AdvancedFiltersProps {
  onApply: (filters: {
    yearFrom?: number;
    yearTo?: number;
    journal?: string;
    author?: string;
  }) => void;
  onReset: () => void;
}

export function AdvancedFilters({ onApply, onReset }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [journal, setJournal] = useState("");
  const [author, setAuthor] = useState("");

  const handleApply = () => {
    onApply({
      yearFrom: yearFrom ? parseInt(yearFrom) : undefined,
      yearTo: yearTo ? parseInt(yearTo) : undefined,
      journal: journal || undefined,
      author: author || undefined,
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    setYearFrom("");
    setYearTo("");
    setJournal("");
    setAuthor("");
    onReset();
    setIsOpen(false);
  };

  const hasActiveFilters = yearFrom || yearTo || journal || author;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
          hasActiveFilters
            ? "border-blue-600 bg-blue-50 text-blue-700"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Advanced Filters
        {hasActiveFilters && (
          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
            Active
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-96 rounded-lg border bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Advanced Filters
            </h3>

            <div className="space-y-4">
              {/* Year Range */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Publication Year
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    placeholder="From"
                    min="1900"
                    max="2099"
                  />
                  <span className="text-sm font-medium text-gray-600">to</span>
                  <Input
                    type="number"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    placeholder="To"
                    min="1900"
                    max="2099"
                  />
                </div>
              </div>

              {/* Journal Filter */}
              <Input
                id="journal"
                type="text"
                label="Journal"
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                placeholder="e.g., Nature, Science, PLOS ONE"
              />

              {/* Author Filter */}
              <Input
                id="author"
                type="text"
                label="Author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name"
              />
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
