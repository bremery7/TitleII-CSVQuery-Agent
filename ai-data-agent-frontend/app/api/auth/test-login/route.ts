import { NextRequest, NextResponse } from 'next/server';
import { findUserByUsername } from '@/lib/user-storage';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Test login endpoint - received:', body);
    
    const user = findUserByUsername(body.username);
    console.log('User lookup result:', user ? {
      id: user.id,
      username: user.username,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      passwordMatch: user.password === body.password
    } : 'User not found');
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }
    
    const passwordMatch = user.password === body.password;
    
    return NextResponse.json({
      success: passwordMatch,
      user: passwordMatch ? {
        id: user.id,
        username: user.username,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin
      } : null,
      error: passwordMatch ? null : 'Invalid password'
    });
  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
