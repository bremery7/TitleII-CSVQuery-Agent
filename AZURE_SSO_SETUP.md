# Azure AD (Entra ID) SSO Setup Guide

## Overview

The application now supports Single Sign-On (SSO) with Microsoft Azure AD (Entra ID). Administrators can configure SSO through the web UI without modifying code or environment variables.

## Features

- ✅ **UI-Based Configuration** - Configure Azure AD SSO through the admin panel
- ✅ **Toggle Local Auth** - Enable/disable username/password authentication
- ✅ **Dynamic Provider Loading** - NextAuth automatically loads providers based on configuration
- ✅ **Secure Storage** - Client secrets are stored securely and never exposed to the frontend
- ✅ **No Code Changes Required** - All configuration done through the UI

## Quick Start

### 1. Access the SSO Configuration Page

1. Log in as an admin user (username: `admin`, password: `admin123`)
2. Click on "Manage" in the navigation (or go to `/manage`)
3. Click on "SSO Configuration"

### 2. Configure Azure AD in Azure Portal

Before enabling SSO in the application, you need to set up an app registration in Azure:

1. **Go to Azure Portal** → Azure Active Directory → App Registrations
2. **Create a new registration** or select an existing app
3. **Set the Redirect URI**:
   - Type: Web
   - URI: `http://localhost:3000/api/auth/callback/azure-ad`
   - For production: `https://yourdomain.com/api/auth/callback/azure-ad`
4. **Create a Client Secret**:
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Add a description and set expiration
   - **Copy the secret value immediately** (you won't be able to see it again)
5. **Note the following values**:
   - **Tenant ID**: Found in Overview page
   - **Application (Client) ID**: Found in Overview page
   - **Client Secret**: The value you just copied

### 3. Configure SSO in the Application

1. In the SSO Configuration page (`/manage/sso`):
2. Toggle "Enable Azure AD SSO" to ON
3. Enter the following values from Azure Portal:
   - **Azure AD Tenant ID**: Your tenant ID (GUID format)
   - **Application (Client) ID**: Your application ID (GUID format)
   - **Client Secret**: The secret value you copied
4. Choose whether to keep local authentication enabled:
   - **Enable Local Authentication ON**: Users can sign in with either Azure AD or username/password
   - **Enable Local Authentication OFF**: Only Azure AD sign-in is available
5. Click "Save Configuration"
6. **Restart the application** for changes to take effect

### 4. Restart the Application

SSO configuration changes require a server restart:

```powershell
# Stop the current server (Ctrl+C)
# Then restart:
cd c:\dev\ai-data-agent-frontend
npm run dev
```

### 5. Test SSO

1. Go to the login page
2. You should now see a "Sign in with Microsoft" button
3. Click it to test Azure AD authentication
4. You'll be redirected to Microsoft's login page
5. After successful authentication, you'll be redirected back to the application

## Configuration Options

### Enable Azure AD SSO
- **ON**: Azure AD sign-in button appears on login page
- **OFF**: Only local authentication is available

### Enable Local Authentication
- **ON**: Username/password login is available
- **OFF**: Only SSO login is available (⚠️ Make sure SSO is working before disabling this!)

## File Structure

The SSO implementation consists of the following files:

```
c:\dev\ai-data-agent-frontend\
├── lib\
│   └── sso-config.ts              # SSO configuration storage and utilities
├── app\
│   ├── api\
│   │   ├── sso-config\
│   │   │   └── route.ts           # API endpoint for SSO configuration (admin only)
│   │   ├── sso-status\
│   │   │   └── route.ts           # Public API to check SSO status
│   │   └── auth\
│   │       └── [...nextauth]\
│   │           └── route.ts       # NextAuth configuration with dynamic providers
│   ├── manage\
│   │   ├── page.tsx               # Management dashboard
│   │   └── sso\
│   │       └── page.tsx           # SSO configuration UI
│   └── login\
│       └── page.tsx               # Login page with dynamic SSO button
└── data\
    └── sso-config.json            # SSO configuration file (auto-created)
```

## Security Considerations

1. **Client Secret Storage**: The client secret is stored in `data/sso-config.json` and never exposed to the frontend
2. **Admin-Only Access**: Only users with admin role can view or modify SSO configuration
3. **HTTPS Required**: In production, always use HTTPS for OAuth callbacks
4. **Secret Rotation**: Regularly rotate your Azure AD client secrets
5. **Backup Configuration**: The `data/sso-config.json` file should be backed up but kept secure

## Troubleshooting

### "Sign in with Microsoft" button doesn't appear
- Check that SSO is enabled in `/manage/sso`
- Verify the server was restarted after configuration changes
- Check browser console for errors

### Azure AD login fails
- Verify the Redirect URI in Azure Portal matches exactly: `http://localhost:3000/api/auth/callback/azure-ad`
- Check that the Client ID, Tenant ID, and Client Secret are correct
- Ensure the client secret hasn't expired
- Check server logs for detailed error messages

### Can't access admin panel
- Log in with default admin credentials: `admin` / `admin123`
- If local auth is disabled and SSO isn't working, you'll need to manually edit `data/sso-config.json` to re-enable local auth

### Server won't start after configuration
- Check server logs for errors
- Verify `data/sso-config.json` is valid JSON
- If needed, delete `data/sso-config.json` to reset to defaults

## Production Deployment

For production deployment:

1. **Update Redirect URI** in both:
   - Azure Portal app registration
   - Use your production domain: `https://yourdomain.com/api/auth/callback/azure-ad`

2. **Set Environment Variables**:
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=<generate-a-secure-random-string>
   ```

3. **Secure the data directory**:
   - Ensure `data/sso-config.json` has appropriate file permissions
   - Include in backups but exclude from version control

4. **Consider disabling local auth** once SSO is confirmed working

## API Reference

### GET /api/sso-status
Public endpoint to check SSO configuration status.

**Response:**
```json
{
  "ssoEnabled": true,
  "provider": "azure-ad",
  "localAuthEnabled": true
}
```

### GET /api/sso-config
Admin-only endpoint to retrieve full SSO configuration (client secret is masked).

**Response:**
```json
{
  "enabled": true,
  "provider": "azure-ad",
  "azureAd": {
    "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "hasClientSecret": true
  },
  "localAuthEnabled": true,
  "updatedAt": "2025-10-30T12:00:00.000Z",
  "updatedBy": "admin"
}
```

### POST /api/sso-config
Admin-only endpoint to update SSO configuration.

**Request Body:**
```json
{
  "enabled": true,
  "provider": "azure-ad",
  "azureAd": {
    "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "clientSecret": "your-client-secret",
    "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  },
  "localAuthEnabled": true
}
```

**Response:**
```json
{
  "message": "SSO configuration updated successfully",
  "config": { ... },
  "requiresRestart": true
}
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for detailed error messages
3. Verify Azure AD configuration in Azure Portal
4. Ensure all GUIDs are in correct format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
