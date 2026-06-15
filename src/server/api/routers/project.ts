import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const projectRouter = createTRPCRouter({
  // Create a new project in an organization
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().min(1).max(100),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is member of organization
      const orgMembership = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
        },
      });

      if (!orgMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member of this organization to create projects",
        });
      }

      // Create project and add creator as owner
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          description: input.description,
          organizationId: input.organizationId,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: "OWNER",
            },
          },
        },
        include: {
          organization: true,
          members: {
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

      return project;
    }),

  // List projects in an organization
  listByOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is member of organization
      const orgMembership = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
        },
      });

      if (!orgMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      const projects = await ctx.db.project.findMany({
        where: {
          organizationId: input.organizationId,
        },
        include: {
          members: {
            where: {
              userId: ctx.session.user.id,
            },
            select: {
              role: true,
            },
          },
          _count: {
            select: {
              articles: true,
              members: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return projects.map((project) => ({
        ...project,
        userRole: project.members[0]?.role,
        articleCount: project._count.articles,
        memberCount: project._count.members,
      }));
    }),

  // Get project by ID
  getById: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        include: {
          organization: true,
          members: {
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
            orderBy: {
              createdAt: "asc",
            },
          },
          _count: {
            select: {
              articles: true,
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Check if user is a member
      const userMember = project.members.find(
        (m) => m.userId === ctx.session.user.id
      );

      if (!userMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this project",
        });
      }

      return {
        ...project,
        userRole: userMember.role,
        articleCount: project._count.articles,
      };
    }),

  // Get project review stats
  getStats: protectedProcedure
    .input(z.object({ projectId: z.string() }))
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

      const [total, pending, included, excluded, maybe] = await Promise.all([
        ctx.db.article.count({ where: { projectId: input.projectId } }),
        ctx.db.article.count({
          where: { projectId: input.projectId, reviewDecision: "PENDING" },
        }),
        ctx.db.article.count({
          where: { projectId: input.projectId, reviewDecision: "INCLUDE" },
        }),
        ctx.db.article.count({
          where: { projectId: input.projectId, reviewDecision: "EXCLUDE" },
        }),
        ctx.db.article.count({
          where: { projectId: input.projectId, reviewDecision: "MAYBE" },
        }),
      ]);

      return {
        total,
        pending,
        included,
        excluded,
        maybe,
        reviewed: included + excluded + maybe,
        percentComplete: total > 0 ? Math.round(((included + excluded + maybe) / total) * 100) : 0,
      };
    }),

  // Update project
  update: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin or owner
      const membership = await ctx.db.projectMember.findFirst({
        where: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can update projects",
        });
      }

      const project = await ctx.db.project.update({
        where: { id: input.projectId },
        data: {
          name: input.name,
          description: input.description,
        },
      });

      return project;
    }),

  // Delete project
  delete: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is owner
      const membership = await ctx.db.projectMember.findFirst({
        where: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
          role: "OWNER",
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners can delete projects",
        });
      }

      await ctx.db.project.delete({
        where: { id: input.projectId },
      });

      return { success: true };
    }),
});
