"use client";

import { useState, useRef, useEffect } from "react";

interface Article {
  id: string;
  title: string;
  authors?: string | null;
  journal?: string | null;
  publicationYear?: string | null;
  pmid?: string | null;
  doi?: string | null;
  abstract?: string | null;
  reviewDecision: string;
}

interface ArticlePreviewTooltipProps {
  article: Article;
  children: React.ReactNode;
}

export function ArticlePreviewTooltip({
  article,
  children,
}: ArticlePreviewTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleMouseEnter = (e: React.MouseEvent) => {
    // Delay showing tooltip
    timeoutRef.current = setTimeout(() => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top,
        });
        setIsVisible(true);
      }
    }, 500); // 500ms delay
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const statusColors = {
    PENDING: "bg-gray-100 text-gray-800",
    INCLUDE: "bg-green-100 text-green-800",
    EXCLUDE: "bg-red-100 text-red-800",
    MAYBE: "bg-yellow-100 text-yellow-800",
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="pointer-events-none fixed z-50 w-96 -translate-x-1/2 -translate-y-full transform animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            left: `${position.x}px`,
            top: `${position.y - 16}px`,
          }}
        >
          <div className="mb-2 rounded-xl border border-gray-200 bg-white p-5 shadow-2xl ring-1 ring-black/5">
            {/* Status Badge */}
            <div className="mb-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  statusColors[article.reviewDecision as keyof typeof statusColors]
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {article.reviewDecision}
              </span>
            </div>

            {/* Title */}
            <h3 className="mb-3 font-semibold leading-tight text-gray-900">
              {article.title}
            </h3>

            {/* Metadata */}
            <div className="mb-3 space-y-1.5 text-sm">
              {article.authors && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">👥</span>
                  <span className="text-gray-700 line-clamp-2">{article.authors}</span>
                </div>
              )}
              {article.journal && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">📚</span>
                  <span className="text-gray-700">{article.journal}</span>
                </div>
              )}
              {article.publicationYear && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">📅</span>
                  <span className="text-gray-700">{article.publicationYear}</span>
                </div>
              )}
            </div>

            {/* IDs */}
            {(article.pmid || article.doi) && (
              <div className="border-t border-gray-200 pt-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  {article.pmid && (
                    <span className="rounded bg-blue-50 px-2 py-1 font-mono text-blue-700">
                      PMID: {article.pmid}
                    </span>
                  )}
                  {article.doi && (
                    <span className="rounded bg-purple-50 px-2 py-1 font-mono text-purple-700">
                      DOI: {article.doi}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Abstract Preview */}
            {article.abstract && (
              <div className="mt-3 border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-600 line-clamp-3">
                  {article.abstract}
                </p>
              </div>
            )}

            {/* Hint */}
            <div className="mt-3 border-t border-gray-200 pt-3 text-xs text-gray-500">
              💡 Click to view full details
            </div>
          </div>

          {/* Arrow */}
          <div
            className="mx-auto h-3 w-3 -translate-y-1/2 rotate-45 transform border-b border-r border-gray-200 bg-white"
            style={{ marginLeft: "calc(50% - 6px)" }}
          />
        </div>
      )}
    </>
  );
}
