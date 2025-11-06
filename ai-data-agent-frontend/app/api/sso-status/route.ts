import { NextResponse } from 'next/server';
import { loadSSOConfig } from '@/lib/sso-config';

export const runtime = 'nodejs';

// GET - Public endpoint to check SSO status (no auth required)
export async function GET() {
  try {
    const config = loadSSOConfig();
    
    return NextResponse.json({
      ssoEnabled: config.enabled || false,
      provider: config.provider || null,
      localAuthEnabled: config.localAuthEnabled !== false, // Default to true
    });
  } catch (error) {
    console.log('SSO config not found, returning defaults');
    // Return defaults when config doesn't exist yet
    return NextResponse.json(
      { 
        ssoEnabled: false,
        provider: null,
        localAuthEnabled: true,
      },
      { status: 200 }
    );
  }
}
