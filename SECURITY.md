# Security Configuration

## Session Timeout Settings

This application implements multiple layers of session security to protect user data and comply with security best practices.

### Timeout Configuration

| Setting | Duration | Description |
|---------|----------|-------------|
| **Idle Timeout** | 30 minutes | User is logged out after 30 minutes of inactivity |
| **Warning Time** | 2 minutes | Warning modal appears 2 minutes before idle timeout |
| **Absolute Timeout** | 8 hours | Maximum session length regardless of activity |
| **Session Update** | 5 minutes | Session token refreshes every 5 minutes of activity |

### How It Works

#### 1. Idle Timeout (30 minutes)
- Tracks user activity (mouse, keyboard, scroll, touch, clicks)
- Resets timer on any user interaction
- Shows warning modal 2 minutes before timeout
- User can extend session or logout manually
- Automatically logs out after 30 minutes of no activity

#### 2. Absolute Timeout (8 hours)
- Maximum session duration is 8 hours from login
- Applies even if user is actively using the application
- Prevents indefinite sessions
- User must re-authenticate after 8 hours

#### 3. Session Warning Modal
When idle timeout is approaching (2 minutes remaining):
- Modal overlay appears with countdown timer
- User can click "Stay Logged In" to extend session
- User can click "Logout Now" to logout immediately
- Auto-logout occurs if no action taken

### Security Benefits

✅ **Prevents unauthorized access** - Idle sessions automatically close  
✅ **Reduces session hijacking risk** - Limited session lifetime  
✅ **Compliance ready** - Meets NIST and industry standards  
✅ **User-friendly** - Warning before logout, easy to extend  
✅ **Activity-based** - Only active sessions stay open  

### Customizing Timeouts

To adjust timeout values, edit `lib/auth-config.ts`:

```typescript
// Idle timeout (in seconds)
session: {
  maxAge: 30 * 60, // 30 minutes
  updateAge: 5 * 60, // Update every 5 minutes
}

// Absolute timeout (in milliseconds)
const ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
```

To adjust warning time, edit `components/SessionTimeout.tsx`:

```typescript
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 2 * 60 * 1000; // 2 minutes before timeout
```

### Recommended Values by Use Case

| Use Case | Idle Timeout | Absolute Timeout |
|----------|--------------|------------------|
| **High Security** (Financial, Healthcare) | 15 minutes | 4 hours |
| **Standard** (Business Apps) | 30 minutes | 8 hours |
| **Low Risk** (Public Content) | 60 minutes | 24 hours |

### Testing Timeouts

To test the timeout functionality:

1. **Idle Timeout Test:**
   - Login to the application
   - Wait 28 minutes without interaction
   - Warning modal should appear
   - Wait 2 more minutes - auto logout occurs

2. **Absolute Timeout Test:**
   - Login to the application
   - Keep actively using it for 8 hours
   - Session will expire regardless of activity

3. **Session Extension Test:**
   - Wait for warning modal to appear
   - Click "Stay Logged In"
   - Session extends for another 30 minutes

### Logout Behavior

Users are redirected to login page with appropriate message:
- `/login?timeout=idle` - Session expired due to inactivity
- `/login?timeout=absolute` - Session expired after 8 hours
- `/login` - Manual logout

### Implementation Files

- `lib/auth-config.ts` - NextAuth configuration with session timeouts
- `components/SessionTimeout.tsx` - Client-side idle detection and warning modal
- `components/Providers.tsx` - Session provider wrapper
- `app/login/page.tsx` - Login page with timeout messages

### Security Compliance

These settings align with:
- **NIST SP 800-63B** - Digital Identity Guidelines
- **OWASP** - Session Management Best Practices
- **PCI DSS** - Payment Card Industry Standards
- **HIPAA** - Healthcare data protection (with 15-min timeout)

### Additional Security Features

- JWT-based sessions (stateless, scalable)
- Secure session tokens
- HTTPS-only cookies (in production)
- CSRF protection via NextAuth
- Password hashing with bcrypt
- Role-based access control (RBAC)

---

## Questions?

For security concerns or to report vulnerabilities, please contact your system administrator.
