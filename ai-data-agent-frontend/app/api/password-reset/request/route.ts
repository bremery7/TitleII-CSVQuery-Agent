import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { findUserByEmail } from '@/lib/user-storage';
import { createResetToken } from '@/lib/password-reset';
import { checkRateLimit } from '@/lib/rate-limit';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Rate limit password reset requests (per IP)
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const identifier = `password-reset:${ip}`;

    const allowed = await checkRateLimit(identifier);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    // Find user by email
    const user = findUserByEmail(email);

    // Always return success even if user not found (security best practice)
    // This prevents email enumeration attacks
    if (!user) {
      console.log('Password reset requested for non-existent email:', email);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const token = createResetToken(user.id);
    
    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    // Send email
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset Request</h2>
          <p>Hello ${user.username},</p>
          <p>You requested to reset your password. Click the link below to set a new password:</p>
          <p><a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">AI Data Agent - Title II Reports</p>
        `,
      });

      console.log('Password reset email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Still return success to user for security
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
