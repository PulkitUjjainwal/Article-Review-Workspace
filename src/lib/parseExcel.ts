import * as XLSX from "xlsx";

export interface ParsedArticle {
  pmid?: string;
  title: string;
  authors?: string;
  citation?: string;
  firstAuthor?: string;
  journal?: string;
  publicationYear?: string;
  createDate?: string;
  pmcid?: string;
  nihmsId?: string;
  doi?: string;
}

// Column mapping from Excel headers to our schema
const COLUMN_MAPPINGS: Record<string, keyof ParsedArticle> = {
  // Case-insensitive matching
  pmid: "pmid",
  "pubmed id": "pmid",
  "pubmed_id": "pmid",
  title: "title",
  authors: "authors",
  author: "authors",
  citation: "citation",
  cite: "citation",
  "first author": "firstAuthor",
  "first_author": "firstAuthor",
  journal: "journal",
  "journal/book": "journal",
  "publication year": "publicationYear",
  "publication_year": "publicationYear",
  year: "publicationYear",
  "create date": "createDate",
  "create_date": "createDate",
  date: "createDate",
  pmcid: "pmcid",
  "pmc id": "pmcid",
  nihmsid: "nihmsId",
  "nihms id": "nihmsId",
  nihms: "nihmsId",
  doi: "doi",
};

export function parseExcelFile(file: File): Promise<ParsedArticle[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("Failed to read file"));
          return;
        }

        // Parse workbook
        const workbook = XLSX.read(data, { type: "binary" });

        // Get first worksheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]!];
        if (!firstSheet) {
          reject(new Error("No worksheets found in file"));
          return;
        }

        // Convert to JSON
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        if (rows.length === 0) {
          reject(new Error("File is empty"));
          return;
        }

        // Extract headers and normalize
        const headers = rows[0] as string[];
        const normalizedHeaders = headers.map((h) =>
          String(h).toLowerCase().trim()
        );

        // Map columns to our schema
        const columnMap = new Map<number, keyof ParsedArticle>();
        normalizedHeaders.forEach((header, index) => {
          const field = COLUMN_MAPPINGS[header];
          if (field) {
            columnMap.set(index, field);
          }
        });

        // Check if we have at least the title column
        if (!Array.from(columnMap.values()).includes("title")) {
          reject(new Error('No "Title" column found in file'));
          return;
        }

        // Parse data rows
        const articles: ParsedArticle[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const article: Partial<ParsedArticle> = {};

          // Map columns
          columnMap.forEach((field, colIndex) => {
            const value = row[colIndex];
            if (value !== undefined && value !== null && value !== "") {
              article[field] = String(value).trim();
            }
          });

          // Only add if we have at least a title
          if (article.title) {
            articles.push(article as ParsedArticle);
          }
        }

        resolve(articles);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsBinaryString(file);
  });
}

// Export helper for CSV
export function parseCSVFile(file: File): Promise<ParsedArticle[]> {
  // XLSX library can handle CSV files too
  return parseExcelFile(file);
}
