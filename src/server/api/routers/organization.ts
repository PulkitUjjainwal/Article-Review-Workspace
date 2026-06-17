import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { sendOrganizationInvitation } from "~/lib/email";
import { getBaseUrl } from "~/lib/getBaseUrl";
import { logger } from "~/lib/logger";
import crypto from "crypto";

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

  // List organization members
  listMembers: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is member of organization
      const membership = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      const members = await ctx.db.organizationMember.findMany({
        where: { organizationId: input.organizationId },
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
        orderBy: { createdAt: "asc" },
      });

      return members;
    }),

  // List pending invitations
  listInvitations: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is member of organization
      const membership = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      const invitations = await ctx.db.organizationInvitation.findMany({
        where: {
          organizationId: input.organizationId,
          acceptedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return invitations;
    }),

  // Invite member to organization
  inviteMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        email: z.string().email(),
        role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission (OWNER or ADMIN)
      const membership = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          role: { in: ["OWNER", "ADMIN"] },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only organization owners and admins can invite members",
        });
      }

      // Get organization details
      const organization = await ctx.db.organization.findUnique({
        where: { id: input.organizationId },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Normalize email
      const normalizedEmail = input.email.trim().toLowerCase();

      // Check if user already exists and is a member
      const existingUser = await ctx.db.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        const existingMember = await ctx.db.organizationMember.findFirst({
          where: {
            organizationId: input.organizationId,
            userId: existingUser.id,
          },
        });

        if (existingMember) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User is already a member of this organization",
          });
        }
      }

      // Check if there's already a pending invitation
      const existingInvitation = await ctx.db.organizationInvitation.findFirst({
        where: {
          organizationId: input.organizationId,
          email: normalizedEmail,
          acceptedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (existingInvitation) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An invitation has already been sent to this email",
        });
      }

      // Generate invitation token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      // Create invitation
      const invitation = await ctx.db.organizationInvitation.create({
        data: {
          organizationId: input.organizationId,
          email: normalizedEmail,
          token,
          role: input.role,
          expiresAt,
          invitedBy: ctx.session.user.id,
        },
      });

      // Send invitation email
      const baseUrl = getBaseUrl();
      const inviteUrl = `${baseUrl}/invite/org/${token}`;
      logger.debug('[Org Invitation] Full invite URL:', inviteUrl);
      logger.debug('[Org Invitation] User has account:', !!existingUser);

      try {
        await sendOrganizationInvitation({
          to: normalizedEmail,
          organizationName: organization.name,
          inviterName: ctx.session.user.name || ctx.session.user.email || "A team member",
          inviteUrl,
          hasAccount: !!existingUser,
        });
      } catch (error) {
        console.error("Failed to send organization invitation email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send invitation email. Please try again later.",
        });
      }

      return invitation;
    }),

  // Remove member from organization
  removeMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission (OWNER or ADMIN)
      const membership = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          role: { in: ["OWNER", "ADMIN"] },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can remove members",
        });
      }

      // Check if target user is owner
      const targetMember = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: input.userId,
        },
      });

      if (targetMember?.role === "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot remove organization owner",
        });
      }

      await ctx.db.organizationMember.delete({
        where: {
          id: targetMember!.id,
        },
      });

      return { success: true };
    }),

  // Update member role
  updateMemberRole: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.string(),
        role: z.enum(["ADMIN", "MEMBER"]),
      })
    )
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
          message: "Only owners can change member roles",
        });
      }

      // Find target member
      const targetMember = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: input.userId,
        },
      });

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      if (targetMember.role === "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot change owner role",
        });
      }

      await ctx.db.organizationMember.update({
        where: { id: targetMember.id },
        data: { role: input.role },
      });

      return { success: true };
    }),

  // Cancel invitation
  cancelInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.organizationInvitation.findUnique({
        where: { id: input.invitationId },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      // Check if user has permission
      const membership = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId: invitation.organizationId,
          userId: ctx.session.user.id,
          role: { in: ["OWNER", "ADMIN"] },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can cancel invitations",
        });
      }

      await ctx.db.organizationInvitation.delete({
        where: { id: input.invitationId },
      });

      return { success: true };
    }),

  // Resend invitation
  resendInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.organizationInvitation.findUnique({
        where: { id: input.invitationId },
        include: {
          organization: true,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      // Check if user has permission
      const membership = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId: invitation.organizationId,
          userId: ctx.session.user.id,
          role: { in: ["OWNER", "ADMIN"] },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can resend invitations",
        });
      }

      // Check if invitation is still valid
      if (invitation.expiresAt < new Date()) {
        // Update expiration date
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 7);

        await ctx.db.organizationInvitation.update({
          where: { id: input.invitationId },
          data: { expiresAt: newExpiresAt },
        });
      }

      // Check if user has account
      const existingUser = await ctx.db.user.findUnique({
        where: { email: invitation.email },
      });

      // Resend email
      const baseUrl = getBaseUrl();
      const inviteUrl = `${baseUrl}/invite/org/${invitation.token}`;

      try {
        await sendOrganizationInvitation({
          to: invitation.email,
          organizationName: invitation.organization.name,
          inviterName: ctx.session.user.name || ctx.session.user.email || "A team member",
          inviteUrl,
          hasAccount: !!existingUser,
        });
      } catch (error) {
        console.error("Failed to resend organization invitation email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to resend invitation email. Please try again later.",
        });
      }

      return { success: true };
    }),

  // Accept invitation (public endpoint)
  acceptInvitation: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.organizationInvitation.findUnique({
        where: { token: input.token },
        include: {
          organization: true,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found or expired",
        });
      }

      if (invitation.acceptedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been accepted",
        });
      }

      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired",
        });
      }

      // User must be authenticated
      if (!ctx.session?.user) {
        return {
          requiresAuth: true,
          organizationName: invitation.organization.name,
          email: invitation.email,
        };
      }

      // Check if authenticated user's email matches invitation (normalize both for comparison)
      const normalizedSessionEmail = ctx.session.user.email?.trim().toLowerCase();
      const normalizedInvitationEmail = invitation.email.trim().toLowerCase();

      if (normalizedSessionEmail !== normalizedInvitationEmail) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation was sent to a different email address",
        });
      }

      // Check if user is already a member
      const existingMember = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId: invitation.organizationId,
          userId: ctx.session.user.id,
        },
      });

      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already a member of this organization",
        });
      }

      // Add user to organization and mark invitation as accepted
      await ctx.db.$transaction([
        ctx.db.organizationMember.create({
          data: {
            organizationId: invitation.organizationId,
            userId: ctx.session.user.id,
            role: invitation.role,
          },
        }),
        ctx.db.organizationInvitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        }),
      ]);

      return {
        success: true,
        organizationSlug: invitation.organization.slug,
      };
    }),
});
