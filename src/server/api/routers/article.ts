import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const articleRouter = createTRPCRouter({
  // List articles in a project with filters and pagination
  list: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        search: z.string().optional(),
        status: z.enum(["PENDING", "INCLUDE", "EXCLUDE", "MAYBE"]).optional(),
        yearFrom: z.number().optional(),
        yearTo: z.number().optional(),
        journal: z.string().optional(),
        author: z.string().optional(),
        sortBy: z.enum(["title", "publicationYear", "createdAt", "reviewDecision"]).optional().default("createdAt"),
        sortDirection: z.enum(["asc", "desc"]).optional().default("desc"),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
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

      // Build where clause
      const where: any = {
        projectId: input.projectId,
      };

      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { authors: { contains: input.search, mode: "insensitive" } },
          { journal: { contains: input.search, mode: "insensitive" } },
          { pmid: { contains: input.search } },
          { doi: { contains: input.search } },
        ];
      }

      if (input.status) {
        where.reviewDecision = input.status;
      }

      // Year range filter
      if (input.yearFrom || input.yearTo) {
        const yearFilter: any = {};
        if (input.yearFrom) {
          yearFilter.gte = input.yearFrom.toString();
        }
        if (input.yearTo) {
          yearFilter.lte = input.yearTo.toString();
        }
        where.publicationYear = yearFilter;
      }

      // Journal filter
      if (input.journal) {
        where.journal = { contains: input.journal, mode: "insensitive" };
      }

      // Author filter
      if (input.author) {
        if (!where.OR) {
          where.OR = [];
        }
        where.OR.push(
          { authors: { contains: input.author, mode: "insensitive" } },
          { firstAuthor: { contains: input.author, mode: "insensitive" } }
        );
      }

      // Build orderBy clause
      const orderBy: any = {};
      orderBy[input.sortBy] = input.sortDirection;

      const [articles, total] = await Promise.all([
        ctx.db.article.findMany({
          where,
          take: input.limit,
          skip: input.offset,
          orderBy,
        }),
        ctx.db.article.count({ where }),
      ]);

      return { articles, total };
    }),

  // Get single article by ID
  getById: protectedProcedure
    .input(z.object({ articleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const article = await ctx.db.article.findUnique({
        where: { id: input.articleId },
        include: {
          project: true,
          reviewHistory: {
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      // Check if user is member of project
      const membership = await ctx.db.projectMember.findFirst({
        where: {
          projectId: article.projectId,
          userId: ctx.session.user.id,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this project",
        });
      }

      return article;
    }),

  // Update review decision
  updateReview: protectedProcedure
    .input(
      z.object({
        articleId: z.string(),
        decision: z.enum(["PENDING", "INCLUDE", "EXCLUDE", "MAYBE"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get article and check membership
      const article = await ctx.db.article.findUnique({
        where: { id: input.articleId },
        include: { project: true },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      const membership = await ctx.db.projectMember.findFirst({
        where: {
          projectId: article.projectId,
          userId: ctx.session.user.id,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this project",
        });
      }

      // Update in transaction (history + article)
      const updated = await ctx.db.$transaction(async (tx) => {
        // Create history entry
        await tx.reviewHistory.create({
          data: {
            articleId: input.articleId,
            userId: ctx.session.user.id,
            decision: input.decision,
            notes: input.notes,
          },
        });

        // Update article
        const updatedArticle = await tx.article.update({
          where: { id: input.articleId },
          data: {
            reviewDecision: input.decision,
            reviewedBy: ctx.session.user.id,
            reviewedAt: new Date(),
            reviewNotes: input.notes,
          },
        });

        return updatedArticle;
      });

      return updated;
    }),

  // Bulk update review decision
  bulkUpdateReview: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        articleIds: z.array(z.string()).min(1).max(100),
        decision: z.enum(["PENDING", "INCLUDE", "EXCLUDE", "MAYBE"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check membership
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

      // Update all articles in transaction
      await ctx.db.$transaction(async (tx) => {
        for (const articleId of input.articleIds) {
          // Create history entry
          await tx.reviewHistory.create({
            data: {
              articleId,
              userId: ctx.session.user.id,
              decision: input.decision,
            },
          });

          // Update article
          await tx.article.update({
            where: { id: articleId },
            data: {
              reviewDecision: input.decision,
              reviewedBy: ctx.session.user.id,
              reviewedAt: new Date(),
            },
          });
        }
      });

      return { updated: input.articleIds.length };
    }),
});
