"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "~/lib/api";
import { exportToExcel, exportToCSV } from "~/lib/exportArticles";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { ArticleDetailModal } from "~/components/ArticleDetailModal";
import { AdvancedFilters } from "~/components/AdvancedFilters";
import { toast } from "~/components/ui/Toast";
import { ArticleRow } from "~/components/ArticleRow";
import { Input, Select } from "~/components/ui/Input";
import { useUndoRedo } from "~/hooks/useUndoRedo";

type ReviewDecision = "PENDING" | "INCLUDE" | "EXCLUDE" | "MAYBE";

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ArticlesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<ReviewDecision | undefined>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [advancedFilters, setAdvancedFilters] = useState<{
    yearFrom?: number;
    yearTo?: number;
    journal?: string;
    author?: string;
  }>({});
  const [sortBy, setSortBy] = useState<"title" | "publicationYear" | "createdAt" | "reviewDecision">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const tableRef = useRef<HTMLTableElement>(null);

  // Undo/Redo functionality
  const { executeAction, undo, redo, canUndo, canRedo } = useUndoRedo<{
    articleId: string;
    previousDecision: ReviewDecision;
    newDecision: ReviewDecision;
  }>();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const { data: project } = api.project.getById.useQuery(
    { projectId },
    {
      enabled: status === "authenticated" && !!projectId,
    }
  );

  const { data: articlesData, refetch } = api.article.list.useQuery(
    {
      projectId,
      search: debouncedSearch || undefined,
      status: statusFilter,
      yearFrom: advancedFilters.yearFrom,
      yearTo: advancedFilters.yearTo,
      journal: advancedFilters.journal,
      author: advancedFilters.author,
      sortBy,
      sortDirection,
      limit: pageSize,
      offset: page * pageSize,
    },
    {
      enabled: status === "authenticated" && !!projectId,
    }
  );

  const updateReview = api.article.updateReview.useMutation({
    onSuccess: () => {
      toast.success("Article review updated");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update review: ${error.message}`);
    },
  });

  const bulkUpdate = api.article.bulkUpdateReview.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated ${data.updated} articles`);
      setSelectedIds(new Set());
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update reviews: ${error.message}`);
    },
  });

  const handleReviewDecision = (articleId: string, decision: ReviewDecision) => {
    const article = articlesData?.articles.find((a: { id: string; reviewDecision: ReviewDecision; title: string }) => a.id === articleId);
    if (!article) return;

    const previousDecision = article.reviewDecision;

    // Create an undoable action
    executeAction({
      do: async () => {
        await updateReview.mutateAsync({ articleId, decision });
      },
      undo: async () => {
        await updateReview.mutateAsync({ articleId, decision: previousDecision });
      },
      description: `Changed ${article.title.substring(0, 30)}... from ${previousDecision} to ${decision}`,
      data: { articleId, previousDecision, newDecision: decision },
    });
  };

  const handleBulkDecision = (decision: ReviewDecision) => {
    if (selectedIds.size === 0) return;
    bulkUpdate.mutate({
      projectId,
      articleIds: Array.from(selectedIds),
      decision,
    });
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === articlesData?.articles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(articlesData?.articles.map((a: { id: string }) => a.id) || []));
    }
  };

  const handleExport = (format: "excel" | "csv") => {
    if (!articlesData?.articles) return;

    const filename = `${project?.name.replace(/\s+/g, "_")}_articles`;

    if (format === "excel") {
      exportToExcel(articlesData.articles, filename);
    } else {
      exportToCSV(articlesData.articles, filename);
    }
  };

  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column with default descending
      setSortBy(column);
      setSortDirection("desc");
    }
    setPage(0); // Reset to first page when sorting changes
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Cmd+Z (undo) and Cmd+Shift+Z (redo) globally
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) {
            redo();
            toast.success("Redo successful");
          }
        } else {
          if (canUndo) {
            undo();
            toast.success("Undo successful");
          }
        }
        return;
      }

      // Skip if typing in an input or modal is open
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        selectedArticle
      ) {
        return;
      }

      const articles = articlesData?.articles || [];
      if (articles.length === 0) return;

      switch (e.key.toLowerCase()) {
        case "j": // Next article
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, articles.length - 1));
          break;
        case "k": // Previous article
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "i": // Include focused article
          e.preventDefault();
          if (articles[focusedIndex]) {
            handleReviewDecision(articles[focusedIndex].id, "INCLUDE");
          }
          break;
        case "e": // Exclude focused article
          e.preventDefault();
          if (articles[focusedIndex]) {
            handleReviewDecision(articles[focusedIndex].id, "EXCLUDE");
          }
          break;
        case "m": // Maybe focused article
          e.preventDefault();
          if (articles[focusedIndex]) {
            handleReviewDecision(articles[focusedIndex].id, "MAYBE");
          }
          break;
        case " ": // Toggle selection
          e.preventDefault();
          if (articles[focusedIndex]) {
            toggleSelect(articles[focusedIndex].id);
          }
          break;
        case "enter": // Open focused article
          e.preventDefault();
          if (articles[focusedIndex]) {
            setSelectedArticle(articles[focusedIndex]);
          }
          break;
        case "escape": // Clear selection
          e.preventDefault();
          setSelectedIds(new Set());
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [articlesData, focusedIndex, selectedArticle, canUndo, canRedo, undo, redo]);

  // Reset focused index when articles change
  useEffect(() => {
    setFocusedIndex(0);
  }, [debouncedSearch, statusFilter, advancedFilters, page, sortBy, sortDirection]);

  // Scroll focused row into view
  useEffect(() => {
    const row = document.querySelector(`[data-index="${focusedIndex}"]`);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [focusedIndex]);

  if (status === "loading") {
    return <LoadingSpinner fullScreen message="Loading articles..." />;
  }

  if (!session || !project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/project/${projectId}`)}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <div className="flex-1">
              <div className="text-sm text-gray-600">
                {project.organization.name} / {project.name}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
            </div>
            <div className="flex gap-2">
              {/* Undo/Redo Buttons */}
              <button
                onClick={() => {
                  undo();
                  toast.success("Undo successful");
                }}
                disabled={!canUndo}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Undo (Cmd+Z)"
              >
                ↶ Undo
              </button>
              <button
                onClick={() => {
                  redo();
                  toast.success("Redo successful");
                }}
                disabled={!canRedo}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Redo (Cmd+Shift+Z)"
              >
                ↷ Redo
              </button>

              {articlesData && articlesData.articles.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => handleExport("excel")}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Export Excel
                  </button>
                </div>
              )}
              <button
                onClick={() => router.push(`/project/${projectId}/import`)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Import More
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <Input
                type="text"
                placeholder="Search by title, authors, PMID, DOI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search articles"
              />
            </div>
            <div className="min-w-[180px]">
              <Select
                value={statusFilter || ""}
                onChange={(e) =>
                  setStatusFilter(e.target.value ? (e.target.value as ReviewDecision) : undefined)
                }
                aria-label="Filter by status"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="INCLUDE">Include</option>
                <option value="EXCLUDE">Exclude</option>
                <option value="MAYBE">Maybe</option>
              </Select>
            </div>
            <AdvancedFilters
              onApply={(filters) => setAdvancedFilters(filters)}
              onReset={() => setAdvancedFilters({})}
            />
          </div>
          {articlesData && articlesData.articles.length > 0 && (
            <div className="text-xs text-gray-500">
              Keyboard shortcuts: <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">j/k</kbd> navigate,{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">i</kbd> include,{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">e</kbd> exclude,{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">m</kbd> maybe,{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">space</kbd> select,{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">enter</kbd> open,{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">Cmd+Z</kbd> undo,{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">Cmd+K</kbd> command,{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">?</kbd> help
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center gap-4 rounded-lg bg-blue-50 p-4">
            <span className="font-medium text-blue-900">
              {selectedIds.size} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkDecision("INCLUDE")}
                className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
              >
                Include All
              </button>
              <button
                onClick={() => handleBulkDecision("EXCLUDE")}
                className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700"
              >
                Exclude All
              </button>
              <button
                onClick={() => handleBulkDecision("MAYBE")}
                className="rounded bg-yellow-600 px-3 py-1 text-sm font-medium text-white hover:bg-yellow-700"
              >
                Mark Maybe
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="rounded bg-gray-600 px-3 py-1 text-sm font-medium text-white hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Articles Table */}
        {articlesData && articlesData.articles.length > 0 ? (
          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === articlesData.articles.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300"
                      aria-label="Select all articles"
                    />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => toggleSort("title")}
                    title="Click to sort by title"
                  >
                    <div className="flex items-center gap-1">
                      Title
                      {sortBy === "title" && (
                        <span className="text-blue-600">
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Authors
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => toggleSort("publicationYear")}
                    title="Click to sort by year"
                  >
                    <div className="flex items-center gap-1">
                      Year
                      {sortBy === "publicationYear" && (
                        <span className="text-blue-600">
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => toggleSort("reviewDecision")}
                    title="Click to sort by status"
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortBy === "reviewDecision" && (
                        <span className="text-blue-600">
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {articlesData.articles.map((article, index) => (
                  <ArticleRow
                    key={article.id}
                    article={article}
                    index={index}
                    isSelected={selectedIds.has(article.id)}
                    isFocused={index === focusedIndex}
                    onToggleSelect={toggleSelect}
                    onOpenDetail={setSelectedArticle}
                    onReviewDecision={handleReviewDecision}
                  />
                ))}
              </tbody>
            </table>
            <div className="border-t px-4 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, articlesData.total)} of {articlesData.total} articles
              </div>
              {articlesData.total > pageSize && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(0)}
                    disabled={page === 0}
                    className="rounded border px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    aria-label="First page"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded border px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600">
                    Page {page + 1} of {Math.ceil(articlesData.total / pageSize)}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={(page + 1) * pageSize >= articlesData.total}
                    className="rounded border px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    aria-label="Next page"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setPage(Math.ceil(articlesData.total / pageSize) - 1)}
                    disabled={(page + 1) * pageSize >= articlesData.total}
                    className="rounded border px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    aria-label="Last page"
                  >
                    Last
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No articles found
            </h3>
            <p className="mb-4 text-gray-600">
              {search || statusFilter
                ? "Try adjusting your filters"
                : "Import articles to get started"}
            </p>
            {!search && !statusFilter && (
              <button
                onClick={() => router.push(`/project/${projectId}/import`)}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Import Articles
              </button>
            )}
          </div>
        )}
      </main>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onUpdate={(decision, notes) => {
            updateReview.mutate({
              articleId: selectedArticle.id,
              decision,
              notes,
            });
          }}
        />
      )}
    </div>
  );
}
