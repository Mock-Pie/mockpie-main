# Authentication Implementation Guide

## Overview
This guide explains how to implement authentication protection for all pages in your Next.js frontend application.

## What's Already Implemented

### 1. Authentication Provider (`/app/components/auth/AuthProvider.tsx`)
- Manages authentication state globally
- Handles token storage and validation
- Automatically redirects unauthenticated users to login
- Provides auth context to all components

### 2. Protected Route Component (`/app/components/auth/ProtectedRoute.tsx`)
- Wraps pages that require authentication
- Shows loading spinner while checking auth
- Redirects to login if not authenticated

### 3. Public Route Component (`/app/components/auth/PublicRoute.tsx`)
- Wraps pages that should not be accessed by authenticated users
- Redirects authenticated users to dashboard
- Used for login, signup, etc.

### 4. Updated Layout (`/app/layout.tsx`)
- Wraps entire app with AuthProvider
- Ensures auth context is available everywhere

### 5. Updated Main Page (`/app/page.tsx`)
- Redirects authenticated users to dashboard
- Redirects unauthenticated users to login

## Pages Already Updated

### Public Pages (No Authentication Required)
- ✅ `/Login` - Uses `PublicRoute`
- ✅ `/SignUp` - Uses `PublicRoute`

### Protected Pages (Authentication Required)
- ✅ `/Dashboard` - Uses `ProtectedRoute`
- ✅ `/SubmittedTrials` - Uses `ProtectedRoute`
- ✅ `/ProfileInfo` - Uses `ProtectedRoute`

## Pages That Need to be Updated

### Public Pages (Add PublicRoute)
```typescript
// Add to these pages:
import PublicRoute from "../components/auth/PublicRoute";

const PageName = () => {
  return (
    <PublicRoute>
      {/* Your existing page content */}
    </PublicRoute>
  );
};
```

**Pages to update:**
- `/ForgotPassword`
- `/ResetPassword`
- `/OTPVerifcation`
- `/PasswordResetOTP`
- `/RestoreAccount`
- `/RestoreAccountOTP`

### Protected Pages (Add ProtectedRoute)
```typescript
// Add to these pages:
import ProtectedRoute from "../components/auth/ProtectedRoute";

const PageName = () => {
  return (
    <ProtectedRoute>
      {/* Your existing page content */}
    </ProtectedRoute>
  );
};
```

**Pages to update:**
- `/Feedback`
- `/Calendar`
- `/Record`
- `/Upload`
- `/UploadRecordVideos`
- `/ChangePassword`

## Quick Update Script

You can use this pattern to quickly update pages:

### For Public Pages:
```typescript
'use client';

import React from "react";
import PublicRoute from "../components/auth/PublicRoute";

const PageName = () => {
  return (
    <PublicRoute>
      {/* Your existing JSX */}
    </PublicRoute>
  );
};

export default PageName;
```

### For Protected Pages:
```typescript
'use client';

import React from "react";
import ProtectedRoute from "../components/auth/ProtectedRoute";

const PageName = () => {
  return (
    <ProtectedRoute>
      {/* Your existing JSX */}
    </ProtectedRoute>
  );
};

export default PageName;
```

## Using Auth Context in Components

If you need to access authentication state in your components:

```typescript
import { useAuth } from "../components/auth/AuthProvider";

const MyComponent = () => {
  const { user, isAuthenticated, logout } = useAuth();
  
  // Use auth state as needed
  return (
    <div>
      {isAuthenticated ? `Welcome, ${user?.first_name}` : 'Please log in'}
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

## Authentication Flow

1. **User visits any page**
2. **AuthProvider checks authentication status**
3. **If authenticated:**
   - Public pages redirect to dashboard
   - Protected pages render normally
4. **If not authenticated:**
   - Public pages render normally
   - Protected pages redirect to login
5. **After login:**
   - User is redirected to dashboard
   - All subsequent navigation works normally

## Testing the Implementation

1. **Test without authentication:**
   - Clear localStorage
   - Visit any protected page
   - Should redirect to login

2. **Test with authentication:**
   - Login successfully
   - Visit any public page (login/signup)
   - Should redirect to dashboard

3. **Test token expiration:**
   - Login and wait for token to expire
   - Try to access protected page
   - Should redirect to login

## Security Features

- ✅ Automatic token validation
- ✅ Secure token storage in localStorage
- ✅ Automatic logout on token expiration
- ✅ Protection against accessing protected routes without auth
- ✅ Prevention of authenticated users accessing public routes
- ✅ Loading states during auth checks

## Troubleshooting

### Common Issues:

1. **Infinite redirects:**
   - Check that public routes are properly configured
   - Ensure AuthProvider is not checking auth on public routes

2. **Auth not working:**
   - Verify AuthProvider is wrapping the app in layout.tsx
   - Check that tokens are being stored correctly

3. **Loading forever:**
   - Check network requests to auth endpoints
   - Verify backend is responding correctly

### Debug Mode:
Add this to see auth state in console:
```typescript
const { user, loading, isAuthenticated } = useAuth();
console.log('Auth state:', { user, loading, isAuthenticated });
```

## Next Steps

1. Update all remaining pages using the patterns above
2. Test the authentication flow thoroughly
3. Consider adding refresh token logic for better UX
4. Add error boundaries for better error handling
5. Consider adding remember me functionality

## Files Modified

- ✅ `app/layout.tsx` - Added AuthProvider
- ✅ `app/page.tsx` - Added auth redirect logic
- ✅ `app/Login/page.tsx` - Added PublicRoute
- ✅ `app/Login/components/LoginForm.tsx` - Updated to use auth context
- ✅ `app/SignUp/page.tsx` - Added PublicRoute
- ✅ `app/Dashboard/page.tsx` - Added ProtectedRoute
- ✅ `app/SubmittedTrials/page.tsx` - Added ProtectedRoute
- ✅ `app/ProfileInfo/page.tsx` - Added ProtectedRoute
- ✅ `app/components/auth/AuthProvider.tsx` - Created
- ✅ `app/components/auth/ProtectedRoute.tsx` - Created
- ✅ `app/components/auth/PublicRoute.tsx` - Created
- ✅ `app/components/auth/AuthGuard.tsx` - Created utilities 