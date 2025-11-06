import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getUsers, findUserById, updateUser as saveUser, findUserByUsername } from '@/lib/user-storage';

// PATCH - Update user (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const currentUserId = (session.user as any).id;
  const isSuperAdmin = (session.user as any).isSuperAdmin;

  try {
    const userId = params.id;
    const body = await request.json();
    const { username, email, role, password } = body;

    const user = findUserById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent editing super admin
    if (user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Cannot edit super admin user. Super admin can only change their own password.' },
        { status: 403 }
      );
    }

    // Prevent users from changing their own role
    if (userId === currentUserId && role && role !== user.role) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 403 }
      );
    }

    const updates: any = {};

    // Check if username is being changed and if it already exists
    if (username && username !== user.username) {
      const existingUser = findUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 400 }
        );
      }
      updates.username = username;
    }

    // Update email if provided
    if (email !== undefined) {
      updates.email = email || undefined;
    }

    // Update role if provided
    if (role) {
      // Prevent removing the last admin
      if (user.role === 'admin' && role !== 'admin') {
        const users = getUsers();
        const adminCount = users.filter(u => u.role === 'admin').length;
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: 'Cannot change role of the last admin user' },
            { status: 400 }
          );
        }
      }
      updates.role = role;
    }

    // Update password if provided
    if (password) {
      // Only super admins can change admin passwords
      if (user.role === 'admin' && !isSuperAdmin) {
        return NextResponse.json(
          { error: 'Only super admins can change admin passwords. Regular admins must use "Change Password" or "Forgot Password".' },
          { status: 403 }
        );
      }
      updates.password = password;
    }

    // Save updates
    saveUser(userId, updates);

    // Get updated user
    const updatedUser = findUserById(userId);
    
    // Remove password from response
    const { password: _, ...safeUser } = updatedUser!;

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
