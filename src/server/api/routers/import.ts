import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createArticleValidationPipeline } from "../../services/validation";

// Article input schema
const articleInputSchema = z.object({
  pmid: z.string().optional(),
  title: z.string(),
  authors: z.string().optional(),
  citation: z.string().optional(),
  firstAuthor: z.string().optional(),
  journal: z.string().optional(),
  publicationYear: z.string().optional(),
  createDate: z.string().optional(),
  pmcid: z.string().optional(),
  nihmsId: z.string().optional(),
  doi: z.string().optional(),
});

export const importRouter = createTRPCRouter({
  // Upload and import articles
  uploadArticles: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        articles: z.array(articleInputSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is member of project
      const membership = await ctx.db.projectMember.findFirst({
        where: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this project",
        });
      }

      // Validate articles
      const pipeline = createArticleValidationPipeline();
      const validationErrors: Array<{ row: number; error: string }> = [];
      const invalidRows = new Set<number>();

      input.articles.forEach((article, index) => {
        const rowNumber = index + 2; // Excel rows start at 2 (header is row 1)
        const errors = pipeline.validate(article, rowNumber);

        if (errors.length > 0) {
          errors.forEach((err) => {
            validationErrors.push({
              row: err.row,
              error: `${err.field}: ${err.error}`,
            });
            invalidRows.add(rowNumber);
          });
        }
      });

      // Filter out invalid articles
      const validArticles = input.articles.filter(
        (_, index) => !invalidRows.has(index + 2)
      );

      // Deduplicate
      const { unique, duplicates } = await deduplicateArticles(
        ctx.db,
        validArticles,
        input.projectId
      );

      // Import unique articles
      const importBatchId = generateBatchId();
      let importedCount = 0;

      if (unique.length > 0) {
        await ctx.db.article.createMany({
          data: unique.map((article) => ({
            ...article,
            projectId: input.projectId,
            importBatch: importBatchId,
            reviewDecision: "PENDING" as const,
          })),
        });
        importedCount = unique.length;
      }

      return {
        imported: importedCount,
        skipped: [...validationErrors, ...duplicates],
        batchId: importBatchId,
      };
    }),
});

// Helper: Deduplicate articles
async function deduplicateArticles(
  db: any,
  articles: z.infer<typeof articleInputSchema>[],
  projectId: string
) {
  const duplicates: Array<{ row: number; error: string }> = [];
  const unique: z.infer<typeof articleInputSchema>[] = [];

  // Get existing PMIDs and DOIs in project
  const existing = await db.article.findMany({
    where: { projectId },
    select: { pmid: true, doi: true },
  });

  const existingPMIDs = new Set(
    existing.filter((a: any) => a.pmid).map((a: any) => a.pmid)
  );

  const existingDOIs = new Set(
    existing
      .filter((a: any) => a.doi)
      .map((a: any) => a.doi!.toLowerCase())
  );

  // Track PMIDs/DOIs within current import batch
  const batchPMIDs = new Set<string>();
  const batchDOIs = new Set<string>();

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]!;
    const rowNumber = i + 2;
    let isDuplicate = false;

    // Check PMID
    if (article.pmid) {
      if (existingPMIDs.has(article.pmid) || batchPMIDs.has(article.pmid)) {
        duplicates.push({
          row: rowNumber,
          error: `Duplicate PMID: ${article.pmid}`,
        });
        isDuplicate = true;
      } else {
        batchPMIDs.add(article.pmid);
      }
    }

    // Check DOI (case-insensitive)
    if (!isDuplicate && article.doi) {
      const doiLower = article.doi.toLowerCase();
      if (existingDOIs.has(doiLower) || batchDOIs.has(doiLower)) {
        duplicates.push({
          row: rowNumber,
          error: `Duplicate DOI: ${article.doi}`,
        });
        isDuplicate = true;
      } else {
        batchDOIs.add(doiLower);
      }
    }

    if (!isDuplicate) {
      unique.push(article);
    }
  }

  return { unique, duplicates };
}

// Helper: Generate batch ID
function generateBatchId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
