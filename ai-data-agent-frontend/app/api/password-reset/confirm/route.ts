import { NextRequest, NextResponse } from 'next/server';
import { findUserById, updateUser } from '@/lib/user-storage';
import { validateResetToken, consumeResetToken } from '@/lib/password-reset';
import { validatePassword } from '@/lib/password-validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password complexity
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Validate token and get user ID
    const userId = validateResetToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Find user
    const user = findUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update password
    updateUser(userId, { password: newPassword });

    // Consume the token (can only be used once)
    consumeResetToken(token);

    console.log('Password reset successful for user:', user.username);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
