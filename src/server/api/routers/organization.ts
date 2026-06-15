import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const organizationRouter = createTRPCRouter({
  // Create a new organization
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate slug from name
      const slug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Check if slug already exists
      const existing = await ctx.db.organization.findUnique({
        where: { slug },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An organization with this name already exists",
        });
      }

      // Create organization and add creator as owner
      const organization = await ctx.db.organization.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: "OWNER",
            },
          },
        },
        include: {
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

      return organization;
    }),

  // List all organizations the user is a member of
  list: protectedProcedure.query(async ({ ctx }) => {
    const organizations = await ctx.db.organization.findMany({
      where: {
        members: {
          some: {
            userId: ctx.session.user.id,
          },
        },
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
        projects: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return organizations.map((org: typeof organizations[number]) => ({
      ...org,
      userRole: org.members[0]?.role ?? "MEMBER",
      projectCount: org._count.projects,
      memberCount: org._count.members,
    }));
  }),

  // Get organization by slug
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const organization = await ctx.db.organization.findUnique({
        where: { slug: input.slug },
        include: {
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
          projects: {
            include: {
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
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Check if user is a member
      const userMember = organization.members.find(
        (m: typeof organization.members[number]) => m.userId === ctx.session.user.id
      );

      if (!userMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      return {
        ...organization,
        userRole: userMember.role,
      };
    }),

  // Update organization
  update: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin or owner
      const membership = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can update organizations",
        });
      }

      const organization = await ctx.db.organization.update({
        where: { id: input.organizationId },
        data: {
          name: input.name,
          description: input.description,
        },
      });

      return organization;
    }),

  // Delete organization
  delete: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is owner
      const membership = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          role: "OWNER",
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners can delete organizations",
        });
      }

      await ctx.db.organization.delete({
        where: { id: input.organizationId },
      });

      return { success: true };
    }),
});
