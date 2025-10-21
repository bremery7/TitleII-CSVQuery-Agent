import crypto from 'crypto';

interface ResetToken {
  token: string;
  userId: string;
  expiresAt: Date;
}

// In-memory storage for reset tokens
export const resetTokens: ResetToken[] = [];

export function createResetToken(userId: string): string {
  // Generate a secure random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Token expires in 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  
  // Remove any existing tokens for this user
  const index = resetTokens.findIndex(t => t.userId === userId);
  if (index !== -1) {
    resetTokens.splice(index, 1);
  }
  
  // Store the new token
  resetTokens.push({ token, userId, expiresAt });
  
  return token;
}

export function validateResetToken(token: string): string | null {
  const resetToken = resetTokens.find(t => t.token === token);
  
  if (!resetToken) {
    return null;
  }
  
  // Check if token has expired
  if (new Date() > resetToken.expiresAt) {
    // Remove expired token
    const index = resetTokens.findIndex(t => t.token === token);
    if (index !== -1) {
      resetTokens.splice(index, 1);
    }
    return null;
  }
  
  return resetToken.userId;
}

export function consumeResetToken(token: string): boolean {
  const index = resetTokens.findIndex(t => t.token === token);
  
  if (index === -1) {
    return false;
  }
  
  // Remove the token after use
  resetTokens.splice(index, 1);
  return true;
}
