import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { findUserByUsername } from '@/lib/user-storage';
import { checkRateLimit, getRemainingAttempts } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Username:', username);
    console.log('Password length:', password?.length);

    // Get IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const identifier = `login:${ip}:${username}`;

    // Check rate limit
    const allowed = await checkRateLimit(identifier);
    if (!allowed) {
      const remaining = getRemainingAttempts(identifier);
      console.log('Rate limit exceeded for:', identifier);
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again in 15 minutes.',
          remainingAttempts: 0
        },
        { status: 429 }
      );
    }

    // Find user
    let user;
    try {
      user = findUserByUsername(username);
      console.log('User found:', user ? 'Yes' : 'No');
      if (user) {
        console.log('User ID:', user.id);
        console.log('User role:', user.role);
        console.log('Password match:', user.password === password);
      }
    } catch (error) {
      console.error('Error finding user:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }
    
    if (!user || user.password !== password) {
      console.log('Invalid credentials - login failed');
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create session
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.userId = user.id;
    session.username = user.username;
    session.role = user.role;
    session.isLoggedIn = true;
    session.isSuperAdmin = user.isSuperAdmin || false;
    await session.save();

    console.log('Login successful');

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
