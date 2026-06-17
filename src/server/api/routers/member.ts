import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { sendProjectInvitation } from "~/lib/email";
import { getBaseUrl } from "~/lib/getBaseUrl";
import { logger } from "~/lib/logger";
import crypto from "crypto";

export const memberRouter = createTRPCRouter({
  // List project members
  listMembers: protectedProcedure
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

      const members = await ctx.db.projectMember.findMany({
        where: { projectId: input.projectId },
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

      const invitations = await ctx.db.projectInvitation.findMany({
        where: {
          projectId: input.projectId,
          acceptedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return invitations;
    }),

  // Invite member by email
  inviteMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        email: z.string().email(),
        role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission (OWNER or ADMIN)
      const membership = await ctx.db.projectMember.findFirst({
        where: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
          role: { in: ["OWNER", "ADMIN"] },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only project owners and admins can invite members",
        });
      }

      // Get project details
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        include: {
          organization: true,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Check if user already exists and is a member
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        const existingMember = await ctx.db.projectMember.findFirst({
          where: {
            projectId: input.projectId,
            userId: existingUser.id,
          },
        });

        if (existingMember) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User is already a member of this project",
          });
        }
      }

      // Check if there's already a pending invitation
      const existingInvitation = await ctx.db.projectInvitation.findFirst({
        where: {
          projectId: input.projectId,
          email: input.email,
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

      // Check if user already has an account
      const invitedUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      // Create invitation
      const invitation = await ctx.db.projectInvitation.create({
        data: {
          projectId: input.projectId,
          email: input.email,
          token,
          role: input.role,
          expiresAt,
          invitedBy: ctx.session.user.id,
        },
      });

      // Send invitation email
      const baseUrl = getBaseUrl();
      const inviteUrl = `${baseUrl}/invite/${token}`;
      // Only log in development - contains sensitive URLs
      logger.debug('[Invitation] Base URL:', baseUrl);
      logger.debug('[Invitation] Full invite URL:', inviteUrl);
      logger.debug('[Invitation] User has account:', !!invitedUser);

      // Always send email, but message differs based on whether user exists
      try {
        await sendProjectInvitation({
          to: input.email,
          projectName: project.name,
          inviterName: ctx.session.user.name || ctx.session.user.email || "A team member",
          inviteUrl,
          hasAccount: !!invitedUser,
        });
      } catch (error) {
        // If email fails but user has account, that's OK - they'll see it in dashboard
        if (invitedUser) {
          logger.warn('[Invitation] Email failed but user has account, will see in dashboard');
          return {
            success: true,
            invitation,
            message: "Invitation created! The user will see it when they log in.",
          };
        }

        // If email fails and user doesn't have account, delete invitation
        await ctx.db.projectInvitation.delete({
          where: { id: invitation.id },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send invitation email. Please try again.",
        });
      }

      return {
        success: true,
        invitation,
        message: invitedUser
          ? "Invitation sent! The user will also see it in their dashboard when they log in."
          : "Invitation sent! The user will receive an email.",
      };
    }),

  // Get invitation details (public - no auth required, for showing which email was invited)
  getInvitationDetails: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.db.projectInvitation.findUnique({
        where: { token: input.token },
        select: {
          email: true,
          expiresAt: true,
          acceptedAt: true,
        },
      });

      if (!invitation) {
        return { email: null };
      }

      return {
        email: invitation.email,
        expired: new Date() > invitation.expiresAt,
        accepted: !!invitation.acceptedAt,
      };
    }),

  // Accept invitation (by token)
  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.projectInvitation.findUnique({
        where: { token: input.token },
        include: {
          project: true,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found or has expired",
        });
      }

      // Check if already accepted
      if (invitation.acceptedAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This invitation has already been accepted",
        });
      }

      // Check if expired
      if (new Date() > invitation.expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired",
        });
      }

      // Check if user's email matches invitation (normalize both for comparison)
      const normalizedSessionEmail = ctx.session.user.email?.trim().toLowerCase();
      const normalizedInvitationEmail = invitation.email.trim().toLowerCase();

      if (normalizedSessionEmail !== normalizedInvitationEmail) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation was sent to a different email address",
        });
      }

      // Check if already a member
      const existingMember = await ctx.db.projectMember.findFirst({
        where: {
          projectId: invitation.projectId,
          userId: ctx.session.user.id,
        },
      });

      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already a member of this project",
        });
      }

      // Add user to project
      await ctx.db.projectMember.create({
        data: {
          projectId: invitation.projectId,
          userId: ctx.session.user.id,
          role: invitation.role,
        },
      });

      // Mark invitation as accepted
      await ctx.db.projectInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return {
        success: true,
        project: invitation.project,
      };
    }),

  // Remove member from project
  removeMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission (OWNER or ADMIN)
      const membership = await ctx.db.projectMember.findFirst({
        where: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
          role: { in: ["OWNER", "ADMIN"] },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only project owners and admins can remove members",
        });
      }

      // Check if trying to remove an owner
      const targetMember = await ctx.db.projectMember.findFirst({
        where: {
          projectId: input.projectId,
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
          message: "Cannot remove project owner",
        });
      }

      // Remove member
      await ctx.db.projectMember.delete({
        where: { id: targetMember.id },
      });

      return { success: true };
    }),

  // Update member role
  updateMemberRole: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
        role: z.enum(["ADMIN", "MEMBER"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission (OWNER only)
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
          message: "Only project owners can change member roles",
        });
      }

      // Get target member
      const targetMember = await ctx.db.projectMember.findFirst({
        where: {
          projectId: input.projectId,
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

      // Update role
      await ctx.db.projectMember.update({
        where: { id: targetMember.id },
        data: { role: input.role },
      });

      return { success: true };
    }),

  // Cancel invitation
  cancelInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.projectInvitation.findUnique({
        where: { id: input.invitationId },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      // Check if user has permission
      const membership = await ctx.db.projectMember.findFirst({
        where: {
          projectId: invitation.projectId,
          userId: ctx.session.user.id,
          role: { in: ["OWNER", "ADMIN"] },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only project owners and admins can cancel invitations",
        });
      }

      // Delete invitation
      await ctx.db.projectInvitation.delete({
        where: { id: input.invitationId },
      });

      return { success: true };
    }),

  // Resend invitation
  resendInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get invitation
      const invitation = await ctx.db.projectInvitation.findUnique({
        where: { id: input.invitationId },
        include: {
          project: true,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      // Check if already accepted
      if (invitation.acceptedAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This invitation has already been accepted",
        });
      }

      // Check if user has permission
      const membership = await ctx.db.projectMember.findFirst({
        where: {
          projectId: invitation.projectId,
          userId: ctx.session.user.id,
          role: { in: ["OWNER", "ADMIN"] },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only project owners and admins can resend invitations",
        });
      }

      // Generate new invitation URL
      const baseUrl = getBaseUrl();
      const inviteUrl = `${baseUrl}/invite/${invitation.token}`;
      // Only log in development - contains sensitive URLs
      logger.debug('[Resend Invitation] Base URL:', baseUrl);
      logger.debug('[Resend Invitation] Invite URL:', inviteUrl);

      // Send email
      try {
        await sendProjectInvitation({
          to: invitation.email,
          projectName: invitation.project.name,
          inviterName: ctx.session.user.name || ctx.session.user.email || "A team member",
          inviteUrl,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to resend invitation email. Please try again.",
        });
      }

      // Optionally extend expiration date when resending
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      await ctx.db.projectInvitation.update({
        where: { id: invitation.id },
        data: { expiresAt: newExpiresAt },
      });

      return { success: true, message: "Invitation resent successfully" };
    }),

  // Get pending invitations for current user's email
  myPendingInvitations: protectedProcedure.query(async ({ ctx }) => {
    const invitations = await ctx.db.projectInvitation.findMany({
      where: {
        email: ctx.session.user.email!,
        acceptedAt: null, // Not yet accepted
        expiresAt: {
          gte: new Date(), // Not expired
        },
      },
      include: {
        project: {
          include: {
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
        invitedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return invitations;
  }),

  // Accept invitation from dashboard (by invitation ID)
  acceptInvitationDashboard: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.projectInvitation.findUnique({
        where: { id: input.invitationId },
        include: {
          project: true,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      // Check if already accepted
      if (invitation.acceptedAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This invitation has already been accepted",
        });
      }

      // Check if expired
      if (new Date() > invitation.expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired",
        });
      }

      // Check if user's email matches invitation
      if (ctx.session.user.email !== invitation.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation is for a different email address",
        });
      }

      // Check if already a member
      const existingMember = await ctx.db.projectMember.findFirst({
        where: {
          projectId: invitation.projectId,
          userId: ctx.session.user.id,
        },
      });

      if (existingMember) {
        // Mark as accepted anyway and return success
        await ctx.db.projectInvitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        });

        return {
          success: true,
          project: invitation.project,
          message: "You are already a member of this project",
        };
      }

      // Add user to project
      await ctx.db.projectMember.create({
        data: {
          projectId: invitation.projectId,
          userId: ctx.session.user.id,
          role: invitation.role,
        },
      });

      // Mark invitation as accepted
      await ctx.db.projectInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return {
        success: true,
        project: invitation.project,
      };
    }),

  // Decline invitation
  declineInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.projectInvitation.findUnique({
        where: { id: input.invitationId },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      // Check if user's email matches invitation
      if (ctx.session.user.email !== invitation.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation is for a different email address",
        });
      }

      // Delete the invitation
      await ctx.db.projectInvitation.delete({
        where: { id: input.invitationId },
      });

      return { success: true };
    }),
});
