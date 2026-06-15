"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { api } from "~/lib/api";
import { parseExcelFile } from "~/lib/parseExcel";
import type { ParsedArticle } from "~/lib/parseExcel";

export default function ImportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [parsedArticles, setParsedArticles] = useState<ParsedArticle[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: Array<{ row: number; error: string }>;
  } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const { data: project, isLoading } = api.project.getById.useQuery(
    { projectId },
    {
      enabled: status === "authenticated" && !!projectId,
    }
  );

  const importMutation = api.import.uploadArticles.useMutation({
    onSuccess: (result) => {
      setImportResult(result);
      setImporting(false);

      if (result.imported > 0) {
        // Refresh project stats
        setTimeout(() => {
          router.push(`/project/${projectId}`);
        }, 3000);
      }
    },
    onError: (error) => {
      alert(`Import failed: ${error.message}`);
      setImporting(false);
    },
  });

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0]!;
    setParseError(null);
    setParsedArticles([]);
    setImportResult(null);

    try {
      const articles = await parseExcelFile(file);
      setParsedArticles(articles);
    } catch (error: any) {
      setParseError(error.message || "Failed to parse file");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  const handleImport = () => {
    if (parsedArticles.length === 0) return;
    setImporting(true);
    importMutation.mutate({
      projectId,
      articles: parsedArticles,
    });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
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
              ← Back to Project
            </button>
            <div>
              <div className="text-sm text-gray-600">
                {project.organization.name} / {project.name}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Import Articles
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`mb-8 cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            {isDragActive ? "Drop file here" : "Upload Excel or CSV file"}
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            Drag and drop your file here, or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Supported formats: .xlsx, .xls, .csv
          </p>
        </div>

        {/* Parse Error */}
        {parseError && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
            <h3 className="font-semibold text-red-900">Parse Error</h3>
            <p className="text-sm text-red-700">{parseError}</p>
          </div>
        )}

        {/* Preview */}
        {parsedArticles.length > 0 && !importResult && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Preview ({parsedArticles.length} articles)
              </h2>
              <button
                onClick={handleImport}
                disabled={importing}
                className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? "Importing..." : "Import Articles"}
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                      #
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                      Title
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                      PMID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                      Year
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {parsedArticles.slice(0, 10).map((article, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {article.title}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {article.pmid || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {article.publicationYear || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedArticles.length > 10 && (
                <p className="mt-4 text-center text-sm text-gray-500">
                  ... and {parsedArticles.length - 10} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Import Complete
            </h2>
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-green-50 p-4">
                <span className="font-medium text-green-900">
                  Successfully Imported
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {importResult.imported}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-4">
                <span className="font-medium text-yellow-900">Skipped</span>
                <span className="text-2xl font-bold text-yellow-600">
                  {importResult.skipped.length}
                </span>
              </div>
            </div>

            {importResult.skipped.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 font-semibold text-gray-900">
                  Skipped Articles
                </h3>
                <div className="max-h-60 overflow-y-auto rounded border">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                          Row
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                          Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {importResult.skipped.map((skip, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-gray-600">
                            {skip.row}
                          </td>
                          <td className="px-4 py-2 text-gray-900">
                            {skip.error}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => router.push(`/project/${projectId}`)}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                View Project
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
