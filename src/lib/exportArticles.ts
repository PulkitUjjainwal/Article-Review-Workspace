import * as XLSX from "xlsx";

interface Article {
  pmid?: string | null;
  title: string;
  authors?: string | null;
  citation?: string | null;
  firstAuthor?: string | null;
  journal?: string | null;
  publicationYear?: string | null;
  doi?: string | null;
  reviewDecision: string;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
}

export function exportToExcel(articles: Article[], filename: string = "articles") {
  // Prepare data for export
  const exportData = articles.map((article) => ({
    PMID: article.pmid || "",
    Title: article.title,
    Authors: article.authors || "",
    "First Author": article.firstAuthor || "",
    Journal: article.journal || "",
    "Publication Year": article.publicationYear || "",
    DOI: article.doi || "",
    Citation: article.citation || "",
    "Review Decision": article.reviewDecision,
    "Review Date": article.reviewedAt
      ? new Date(article.reviewedAt).toLocaleDateString()
      : "",
    "Review Notes": article.reviewNotes || "",
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  const colWidths = [
    { wch: 10 }, // PMID
    { wch: 50 }, // Title
    { wch: 30 }, // Authors
    { wch: 20 }, // First Author
    { wch: 30 }, // Journal
    { wch: 15 }, // Year
    { wch: 20 }, // DOI
    { wch: 30 }, // Citation
    { wch: 15 }, // Decision
    { wch: 12 }, // Date
    { wch: 30 }, // Notes
  ];
  ws["!cols"] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Articles");

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split("T")[0];
  const fullFilename = `${filename}_${timestamp}.xlsx`;

  // Download file
  XLSX.writeFile(wb, fullFilename);
}

export function exportToCSV(articles: Article[], filename: string = "articles") {
  // Prepare data
  const exportData = articles.map((article) => ({
    PMID: article.pmid || "",
    Title: article.title,
    Authors: article.authors || "",
    "First Author": article.firstAuthor || "",
    Journal: article.journal || "",
    "Publication Year": article.publicationYear || "",
    DOI: article.doi || "",
    Citation: article.citation || "",
    "Review Decision": article.reviewDecision,
    "Review Date": article.reviewedAt
      ? new Date(article.reviewedAt).toLocaleDateString()
      : "",
    "Review Notes": article.reviewNotes || "",
  }));

  // Convert to CSV
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, "Articles");

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split("T")[0];
  const fullFilename = `${filename}_${timestamp}.csv`;

  // Download as CSV
  XLSX.writeFile(wb, fullFilename, { bookType: "csv" });
}
