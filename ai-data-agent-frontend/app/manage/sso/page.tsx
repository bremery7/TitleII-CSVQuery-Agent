'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface SSOConfig {
  enabled: boolean;
  provider: 'azure-ad' | null;
  azureAd?: {
    clientId: string;
    tenantId: string;
    hasClientSecret: boolean;
  };
  localAuthEnabled: boolean;
  updatedAt: string;
  updatedBy?: string;
}

export default function SSOConfigPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [config, setConfig] = useState<SSOConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [localAuthEnabled, setLocalAuthEnabled] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'admin') {
        router.push('/');
        return;
      }
      loadConfig();
    }
  }, [status, session, router]);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/sso-config');
      if (!response.ok) throw new Error('Failed to load configuration');
      
      const data = await response.json();
      setConfig(data);
      setEnabled(data.enabled);
      setLocalAuthEnabled(data.localAuthEnabled);
      
      if (data.azureAd) {
        setClientId(data.azureAd.clientId);
        setTenantId(data.azureAd.tenantId);
        // Don't set client secret as it's not returned for security
      }
    } catch (err) {
      setError('Failed to load SSO configuration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Validation
      if (enabled && (!clientId || !tenantId)) {
        setError('Client ID and Tenant ID are required when SSO is enabled');
        setSaving(false);
        return;
      }

      if (enabled && !config?.azureAd?.hasClientSecret && !clientSecret) {
        setError('Client Secret is required for initial SSO setup');
        setSaving(false);
        return;
      }

      const payload = {
        enabled,
        provider: enabled ? 'azure-ad' : null,
        localAuthEnabled,
        azureAd: enabled ? {
          clientId,
          clientSecret: clientSecret || undefined, // Only send if changed
          tenantId,
        } : undefined,
      };

      const response = await fetch('/api/sso-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save configuration');
      }

      const result = await response.json();
      setSuccess('SSO configuration saved successfully! Server restart required for changes to take effect.');
      setClientSecret(''); // Clear the secret field after saving
      await loadConfig(); // Reload to get updated config
    } catch (err: any) {
      setError(err.message || 'Failed to save SSO configuration');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1729] via-[#1a1f3a] to-[#0f1729] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1729] via-[#1a1f3a] to-[#0f1729] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/manage')}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
          >
            ← Back to Manage
          </button>
        </div>

        <div className="bg-[#252d47] rounded-lg p-8 border border-[#3d4571] shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2">SSO Configuration</h1>
          <p className="text-gray-400 mb-8">Configure Single Sign-On with Microsoft Azure AD (Entra ID)</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          <div className="space-y-6">
            {/* Enable SSO Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#1a1f3a] rounded-lg">
              <div>
                <h3 className="text-white font-medium">Enable Azure AD SSO</h3>
                <p className="text-gray-400 text-sm">Allow users to sign in with their Microsoft accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Azure AD Configuration */}
            {enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Azure AD Tenant ID *
                  </label>
                  <input
                    type="text"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-4 py-3 bg-[#1a1f3a] border border-[#3d4571] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-gray-500 text-xs mt-1">Found in Azure Portal → Azure Active Directory → Overview</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Application (Client) ID *
                  </label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-4 py-3 bg-[#1a1f3a] border border-[#3d4571] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-gray-500 text-xs mt-1">Found in Azure Portal → App Registrations → Your App → Overview</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Client Secret {config?.azureAd?.hasClientSecret ? '(Optional - leave blank to keep existing)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder={config?.azureAd?.hasClientSecret ? '••••••••••••••••' : 'Enter client secret'}
                    className="w-full px-4 py-3 bg-[#1a1f3a] border border-[#3d4571] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Found in Azure Portal → App Registrations → Your App → Certificates & secrets
                    {config?.azureAd?.hasClientSecret && ' (Currently configured)'}
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                  <h4 className="text-blue-400 font-medium mb-2">Azure AD Setup Instructions</h4>
                  <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                    <li>Go to Azure Portal → Azure Active Directory → App Registrations</li>
                    <li>Create a new registration or select existing app</li>
                    <li>Add redirect URI: <code className="bg-[#1a1f3a] px-2 py-1 rounded">http://localhost:3000/api/auth/callback/azure-ad</code></li>
                    <li>Create a client secret in "Certificates & secrets"</li>
                    <li>Copy the Tenant ID, Client ID, and Client Secret here</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Local Auth Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#1a1f3a] rounded-lg">
              <div>
                <h3 className="text-white font-medium">Enable Local Authentication</h3>
                <p className="text-gray-400 text-sm">Allow users to sign in with username and password</p>
                {!localAuthEnabled && enabled && (
                  <p className="text-yellow-400 text-xs mt-1">⚠️ Warning: Disabling local auth with SSO enabled means only Azure AD users can log in</p>
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localAuthEnabled}
                  onChange={(e) => setLocalAuthEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Configuration Info */}
            {config && (
              <div className="bg-[#1a1f3a] rounded-lg p-4 text-sm">
                <p className="text-gray-400">
                  Last updated: {new Date(config.updatedAt).toLocaleString()}
                  {config.updatedBy && ` by ${config.updatedBy}`}
                </p>
              </div>
            )}

            {/* Save Button */}
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
              <button
                onClick={() => router.push('/manage')}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
