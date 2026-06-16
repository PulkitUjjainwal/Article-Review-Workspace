import { NextResponse } from 'next/server';
import { db } from '~/server/db';

export async function POST(request: Request) {
  try {
    const { email, confirmDelete } = await request.json();

    if (!email || confirmDelete !== 'DELETE') {
      return NextResponse.json(
        { error: 'Invalid request. Must provide email and confirmDelete="DELETE"' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    console.log('Attempting to delete account:', normalizedEmail);

    // Find the user
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'Account not found', email: normalizedEmail },
        { status: 404 }
      );
    }

    console.log('Found user:', user);

    // Delete all associated data (in order due to foreign keys)

    // 1. Delete email verification tokens
    await db.emailVerificationToken.deleteMany({
      where: { email: normalizedEmail },
    });

    // 2. Delete password reset tokens
    await db.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    // 3. Delete review history
    await db.reviewHistory.deleteMany({
      where: { userId: user.id },
    });

    // 4. Delete project memberships
    await db.projectMember.deleteMany({
      where: { userId: user.id },
    });

    // 5. Delete organization memberships
    await db.organizationMember.deleteMany({
      where: { userId: user.id },
    });

    // 6. Delete invitations sent by user
    await db.projectInvitation.deleteMany({
      where: { invitedBy: user.id },
    });

    // 7. Delete OAuth accounts
    await db.account.deleteMany({
      where: { userId: user.id },
    });

    // 8. Delete sessions
    await db.session.deleteMany({
      where: { userId: user.id },
    });

    // 9. Delete the user
    await db.user.delete({
      where: { id: user.id },
    });

    console.log('Successfully deleted account:', user.email);

    return NextResponse.json({
      success: true,
      message: `Account ${user.email} deleted successfully`,
      deletedUser: {
        email: user.email,
        name: user.name,
      },
    });

  } catch (error: any) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account', details: error.message },
      { status: 500 }
    );
  }
}
