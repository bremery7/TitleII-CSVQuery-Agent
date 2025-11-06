import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getUsers, addUser, deleteUser as removeUser, findUserByUsername } from '@/lib/user-storage';
import { validatePassword } from '@/lib/password-validation';

// GET - List all users (admin only)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = getUsers();
  
  // Return users without passwords
  const safeUsers = users.map(({ password, ...user }) => user);
  
  return NextResponse.json({ users: safeUsers });
}

// POST - Create new user (admin only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { username, password, role, email } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate password complexity
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Check if username already exists
    if (findUserByUsername(username)) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    const users = getUsers();

    // Create new user
    const newUser = {
      id: String(users.length + 1),
      username,
      password,
      email: email || undefined,
      role: (role || 'user') as 'admin' | 'user',
      createdAt: new Date().toISOString(),
    };

    addUser(newUser);
    
    // Remove password from response
    const { password: _, ...safeUser } = newUser;
    
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 400 }
    );
  }
}

// DELETE - Delete user (admin only)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const users = getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting super admin
    if (user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete super admin user' },
        { status: 403 }
      );
    }

    // Prevent admins from deleting themselves
    const currentUserId = (session.user as any).id;
    if (user.id === currentUserId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin user' },
          { status: 400 }
        );
      }
    }

    removeUser(userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 400 }
    );
  }
}
