# Authentication System Setup

## ✅ Implementation Complete

### Features Implemented

#### 1. **User Authentication**
- NextAuth.js integration
- Secure login/logout functionality
- Session management with JWT
- Password hashing with bcryptjs

#### 2. **Role-Based Access Control**
- **Admin Users**: Full access to all features
  - Upload CSV files
  - Manage files
  - Create/delete users
  - View database information
  - Query data
  
- **Regular Users**: Read-only access
  - Query data only
  - Cannot upload or manage files
  - Cannot manage users

#### 3. **User Management**
- Admin can create new users
- Admin can delete users (except last admin)
- User list with role badges
- Secure password storage

### Default Admin Account

**Username:** `admin`  
**Password:** `admin123`  
**Role:** admin

⚠️ **IMPORTANT:** Change this password after first login!

### Files Created/Modified

#### New Files:
1. `lib/auth.ts` - NextAuth configuration
2. `lib/users.ts` - User management functions
3. `app/api/auth/[...nextauth]/route.ts` - Auth API route
4. `types/next-auth.d.ts` - TypeScript definitions
5. `app/login/page.tsx` - Login page
6. `components/SessionProvider.tsx` - Session wrapper
7. `components/UserManagement.tsx` - User management UI
8. `app/api/users/route.ts` - User management API
9. `data/users.json` - User database (auto-created)

#### Modified Files:
1. `app/layout.tsx` - Added SessionProvider
2. `app/page.tsx` - Added authentication checks and role-based UI
3. `.env.local` - Added NextAuth configuration

### How It Works

#### Login Flow:
1. User visits the app
2. If not authenticated → redirected to `/login`
3. User enters credentials
4. NextAuth validates against `data/users.json`
5. Session created with JWT token
6. User redirected to main app

#### Admin Features:
- **Upload CSV**: Blue button (admin only)
- **Manage Files**: Blue button (admin only)
- **Database Information**: Gray button (all users)
- **Manage Users**: Purple button (admin only)

#### Regular User Experience:
- See only the query interface
- Can run queries and view results
- Cannot see admin buttons
- Cannot access admin routes

### Security Features

✅ **Password Hashing**: bcrypt with salt rounds  
✅ **JWT Sessions**: Secure token-based authentication  
✅ **Protected Routes**: API routes check admin role  
✅ **UI Protection**: Buttons hidden based on role  
✅ **Last Admin Protection**: Cannot delete last admin user  

### Testing the System

#### Test as Admin:
1. Go to `http://localhost:3000`
2. Login with `admin` / `admin123`
3. You should see all buttons (Upload CSV, Manage Files, Database Info, Manage Users)
4. Try creating a new user
5. Try uploading a CSV file

#### Test as Regular User:
1. Create a new user via "Manage Users" (set role to "user")
2. Logout
3. Login with the new user credentials
4. You should only see the query interface
5. Admin buttons should be hidden
6. Try accessing `/api/users` directly → should get 401 Unauthorized

### User Management

#### Create New User:
1. Login as admin
2. Click "Manage Users"
3. Click "+ Create New User"
4. Fill in username, password, email (optional), role
5. Click "Create User"

#### Delete User:
1. Login as admin
2. Click "Manage Users"
3. Find user in the list
4. Click "Delete" button
5. Confirm deletion

### Environment Variables

Required in `.env.local`:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

### Data Storage

Users are stored in: `data/users.json`

Example structure:
```json
[
  {
    "id": "1",
    "username": "admin",
    "password": "$2a$10$...",
    "email": "admin@example.com",
    "role": "admin",
    "createdAt": "2025-10-19T..."
  }
]
```

### API Endpoints

#### Authentication:
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Get current session

#### User Management (Admin Only):
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `DELETE /api/users?id={userId}` - Delete user

### Next Steps

1. **Test the system**:
   - Start the frontend: `npm run dev`
   - Login as admin
   - Create a test user
   - Test both admin and regular user access

2. **Change default password**:
   - Login as admin
   - Create a new admin user with secure password
   - Delete the default admin account

3. **Optional enhancements**:
   - Add password reset functionality
   - Add user profile editing
   - Add activity logging
   - Add session timeout
   - Add 2FA (two-factor authentication)

### Troubleshooting

#### "Cannot find module '@/components/SessionProvider'"
- Restart your dev server: `npm run dev`
- TypeScript may need to rebuild

#### Login not working:
- Check `.env.local` has NEXTAUTH_SECRET
- Check `data/users.json` exists
- Check console for errors

#### Admin buttons not showing:
- Check you're logged in as admin
- Check session in browser DevTools → Application → Cookies
- Logout and login again

### Security Best Practices

⚠️ **Production Deployment:**
1. Change NEXTAUTH_SECRET to a strong random value
2. Use `openssl rand -base64 32` to generate
3. Change default admin password immediately
4. Use HTTPS in production
5. Consider adding rate limiting
6. Add password complexity requirements
7. Add account lockout after failed attempts

---

**Status:** ✅ Ready for testing  
**Date:** 2025-10-19  
**Version:** 2.0-auth
