import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { loadSSOConfig, updateSSOConfig, SSOConfig } from '@/lib/sso-config';

export const runtime = 'nodejs';

// GET - Retrieve SSO configuration (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const config = loadSSOConfig();
    
    // Don't send the client secret to the frontend, just indicate if it's set
    const safeConfig = {
      ...config,
      azureAd: config.azureAd ? {
        clientId: config.azureAd.clientId,
        tenantId: config.azureAd.tenantId,
        hasClientSecret: !!config.azureAd.clientSecret,
      } : undefined,
    };

    return NextResponse.json(safeConfig);
  } catch (error) {
    console.error('Error loading SSO config:', error);
    return NextResponse.json(
      { error: 'Failed to load SSO configuration' },
      { status: 500 }
    );
  }
}

// POST - Update SSO configuration (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate the configuration
    if (body.enabled && body.provider === 'azure-ad') {
      if (!body.azureAd?.clientId || !body.azureAd?.tenantId) {
        return NextResponse.json(
          { error: 'Azure AD Client ID and Tenant ID are required when SSO is enabled' },
          { status: 400 }
        );
      }
    }

    // If clientSecret is not provided but we're updating, keep the existing one
    const currentConfig = loadSSOConfig();
    const updates: Partial<SSOConfig> = {
      enabled: body.enabled,
      provider: body.provider,
      localAuthEnabled: body.localAuthEnabled,
      azureAd: body.azureAd ? {
        clientId: body.azureAd.clientId,
        tenantId: body.azureAd.tenantId,
        clientSecret: body.azureAd.clientSecret || currentConfig.azureAd?.clientSecret || '',
      } : undefined,
    };

    const updatedConfig = updateSSOConfig(updates, session.user.name || 'admin');
    
    // Return safe config without client secret
    const safeConfig = {
      ...updatedConfig,
      azureAd: updatedConfig.azureAd ? {
        clientId: updatedConfig.azureAd.clientId,
        tenantId: updatedConfig.azureAd.tenantId,
        hasClientSecret: !!updatedConfig.azureAd.clientSecret,
      } : undefined,
    };

    return NextResponse.json({
      message: 'SSO configuration updated successfully',
      config: safeConfig,
      requiresRestart: true, // Indicate that server restart is needed
    });
  } catch (error) {
    console.error('Error updating SSO config:', error);
    return NextResponse.json(
      { error: 'Failed to update SSO configuration' },
      { status: 500 }
    );
  }
}
