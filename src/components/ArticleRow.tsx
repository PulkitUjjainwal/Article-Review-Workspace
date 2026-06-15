import { memo } from "react";
import { ArticlePreviewTooltip } from "./ArticlePreviewTooltip";

type ReviewDecision = "PENDING" | "INCLUDE" | "EXCLUDE" | "MAYBE";

interface Article {
  id: string;
  title: string;
  journal?: string | null;
  pmid?: string | null;
  doi?: string | null;
  firstAuthor?: string | null;
  authors?: string | null;
  publicationYear?: string | null;
  abstract?: string | null;
  reviewDecision: ReviewDecision;
}

interface ArticleRowProps {
  article: Article;
  index: number;
  isSelected: boolean;
  isFocused: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (article: Article) => void;
  onReviewDecision: (id: string, decision: ReviewDecision) => void;
}

function ArticleRowComponent({
  article,
  index,
  isSelected,
  isFocused,
  onToggleSelect,
  onOpenDetail,
  onReviewDecision,
}: ArticleRowProps) {
  return (
    <tr
      className={`hover:bg-gray-50 ${
        isFocused ? "ring-2 ring-blue-500 ring-inset" : ""
      }`}
      data-index={index}
    >
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(article.id)}
          className="h-4 w-4 rounded border-gray-300"
          aria-label={`Select ${article.title}`}
        />
      </td>
      <td className="px-4 py-3">
        <div className="max-w-md">
          <ArticlePreviewTooltip article={article}>
            <button
              onClick={() => onOpenDetail(article)}
              className="font-medium text-gray-900 hover:text-blue-600 text-left"
            >
              {article.title}
            </button>
          </ArticlePreviewTooltip>
          {article.journal && (
            <div className="text-sm text-gray-600">{article.journal}</div>
          )}
          {article.pmid && (
            <div className="text-xs text-gray-500">PMID: {article.pmid}</div>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {article.firstAuthor || article.authors?.split(",")[0] || "-"}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {article.publicationYear || "-"}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={article.reviewDecision} />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <button
            onClick={() => onReviewDecision(article.id, "INCLUDE")}
            className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-200"
            title="Include (keyboard: i)"
            aria-label={`Include ${article.title}`}
          >
            ✓
          </button>
          <button
            onClick={() => onReviewDecision(article.id, "EXCLUDE")}
            className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
            title="Exclude (keyboard: e)"
            aria-label={`Exclude ${article.title}`}
          >
            ✗
          </button>
          <button
            onClick={() => onReviewDecision(article.id, "MAYBE")}
            className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 hover:bg-yellow-200"
            title="Maybe (keyboard: m)"
            aria-label={`Mark ${article.title} as maybe`}
          >
            ?
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: ReviewDecision }) {
  const styles = {
    PENDING: "bg-gray-100 text-gray-800",
    INCLUDE: "bg-green-100 text-green-800",
    EXCLUDE: "bg-red-100 text-red-800",
    MAYBE: "bg-yellow-100 text-yellow-800",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const ArticleRow = memo(ArticleRowComponent);
