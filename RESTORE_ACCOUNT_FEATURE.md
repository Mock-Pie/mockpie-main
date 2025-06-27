# Restore Account Feature (OTP-Protected)

## Overview

The Restore Account feature allows users to recover their deleted accounts within 30 days of deletion. This provides a safety net for users who accidentally delete their accounts or change their mind after deletion. **The feature now includes OTP verification for enhanced security.**

## Features

### Backend Implementation

- **Send OTP Endpoint**: `POST /auth/restore-account-otp`
- **Restore Endpoint**: `POST /users/retrieve` (now requires OTP)
- **Controller**: `backend/app/controllers/authentication/restore_account_otp.py`
- **Retrieve Controller**: `backend/app/controllers/user/retrieve_user.py` (updated)
- **Router**: `backend/app/routers/auth.py` and `backend/app/routers/users.py`

### Frontend Implementation

- **Initial Page**: `/RestoreAccount` - Enter email to request OTP
- **OTP Verification Page**: `/RestoreAccountOTP` - Enter OTP to restore account
- **Components**: `RestoreAccountForm` and `RestoreAccountOTPForm`
- **Service**: `UserService.restoreUser(email, otp)` (updated)

## How It Works

### 1. Account Deletion (Soft Delete)
When a user deletes their account:
- The user record is marked with `deleted_at` timestamp
- All associated presentations and analyses are also soft-deleted
- The account remains in the database but is not accessible

### 2. Account Restoration (Two-Step Process)
Users can restore their account through a secure two-step process:

#### Step 1: Request OTP
1. User visits the `/RestoreAccount` page
2. User enters their email address
3. System validates the email and checks if a deleted account exists
4. If valid, system sends a 6-digit OTP to the user's email
5. User is redirected to `/RestoreAccountOTP` page

#### Step 2: Verify OTP and Restore
1. User enters the 6-digit OTP received via email
2. System verifies the OTP and checks if it's still valid (10-minute expiry)
3. If OTP is valid, the account and all associated data are restored
4. **Email is automatically verified** and user can login directly
5. User is redirected to login page to sign in with original credentials

### 3. 30-Day Limit
- Accounts deleted more than 30 days ago cannot be restored
- This prevents indefinite storage of deleted user data
- After 30 days, the data can be permanently deleted

### 4. Direct Login After Restoration
- **Email verification is automatic** after successful OTP verification
- Users can login immediately after account restoration
- No additional email verification steps required
- Original password and credentials work as before

### 5. Direct Login Benefits
- **Seamless experience**: Users can access their account immediately
- **No friction**: No need for additional email verification
- **Secure**: OTP verification proves email access, making direct login safe
- **User-friendly**: Restored accounts work exactly like before deletion

## API Endpoints

### POST /auth/restore-account-otp

**Request:**
```http
POST /auth/restore-account-otp
Content-Type: application/x-www-form-urlencoded

email=user@example.com
```

**Response (Success - 200):**
```json
{
  "message": "Restoration OTP has been sent to your email"
}
```

**Response (Error - 404):**
```json
{
  "detail": "No deleted account found with this email address"
}
```

**Response (Error - 400):**
```json
{
  "detail": "Cannot restore accounts deleted more than 30 days ago"
}
```

### POST /users/retrieve

**Request:**
```http
POST /users/retrieve
Content-Type: application/x-www-form-urlencoded

email=user@example.com&otp=123456
```

**Response (Success - 200):**
```json
{
  "id": 123,
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "email": "user@example.com",
  "phone_number": "+1234567890",
  "gender": "male",
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00",
  "deleted_at": null
}
```

**Response (Error - 400):**
```json
{
  "detail": "Invalid OTP"
}
```

**Response (Error - 400):**
```json
{
  "detail": "OTP has expired. Please request a new one."
}
```

## Frontend Components

### RestoreAccountForm

The initial form component that handles OTP request:

- **Email validation**: Ensures valid email format
- **Loading states**: Shows progress during OTP sending
- **Error handling**: Displays appropriate error messages
- **Auto-redirect**: Redirects to OTP verification page after successful OTP sending

### RestoreAccountOTPForm

The OTP verification component:

- **OTP input**: 6-digit code input with auto-focus and paste support
- **Loading states**: Shows progress during verification
- **Error handling**: Displays appropriate error messages
- **Resend functionality**: Allows users to request new OTP with cooldown
- **Success feedback**: Confirms successful restoration and redirects to login

### UserService.restoreUser()

Updated service method that requires OTP:

```typescript
static async restoreUser(email: string, otp: string): Promise<RestoreUserResponse>
```

## User Experience

### 1. Access Points
Users can access the restore account feature from:
- **Login page**: Link next to "Forgot your password?"
- **Profile page**: Note in the delete account section

### 2. Two-Step Flow
1. **Step 1**: User enters email → receives OTP via email
2. **Step 2**: User enters OTP → account is restored → redirected to login

### 3. Information Display
The restore account pages include:
- Clear explanation of the 30-day limit
- Information about what gets restored
- Warning about permanent deletion after 30 days
- OTP expiry information (10 minutes)

### 4. Success Flow
After successful restoration:
- User sees confirmation message about email verification
- Automatically redirected to login page
- **Can login immediately** with original credentials
- **No additional verification steps required**

### 5. Direct Login Benefits
- **Seamless experience**: Users can access their account immediately
- **No friction**: No need for additional email verification
- **Secure**: OTP verification proves email access, making direct login safe
- **User-friendly**: Restored accounts work exactly like before deletion

## Security Considerations

### 1. OTP Verification
- 6-digit numeric OTP sent via email
- 10-minute expiry time
- One-time use (cleared after successful verification)
- Rate limiting on OTP requests

### 2. Email Verification
- OTP is sent to the email associated with the deleted account
- Ensures the user has access to the email address
- Prevents unauthorized account restoration

### 3. Time Limits
- 30-day restoration window
- 10-minute OTP expiry
- Multiple security layers

### 4. Rate Limiting
Consider implementing rate limiting to prevent abuse:
- Limit OTP requests per email
- Prevent brute force attacks on OTP
- Cooldown period between OTP requests

## Testing

### Manual Testing
1. Create a test account
2. Delete the account
3. Visit `/RestoreAccount` and enter email
4. Check email for OTP
5. Enter OTP on `/RestoreAccountOTP` page
6. Verify account is restored and can log in

### Automated Testing
Use the provided test script:
```bash
python test_restore_user_otp.py
```

## Database Schema

The feature relies on the existing soft delete implementation:

```sql
-- Users table
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN otp VARCHAR(6) NULL;
ALTER TABLE users ADD COLUMN otp_expired_at TIMESTAMP NULL;

-- Presentations table  
ALTER TABLE presentations ADD COLUMN deleted_at TIMESTAMP NULL;

-- Voice analysis table
ALTER TABLE voice_analysis ADD COLUMN deleted_at TIMESTAMP NULL;

-- Body analysis table
ALTER TABLE body_analysis ADD COLUMN deleted_at TIMESTAMP NULL;
```

## Future Enhancements

### 1. Enhanced Email Templates
- HTML email templates with better styling
- Branded emails with company logo
- Multiple language support

### 2. Admin Interface
- Allow admins to restore accounts
- View deleted accounts and their deletion dates
- Manual OTP generation for admin use

### 3. Analytics
- Track restoration rates
- Monitor OTP success/failure rates
- Analyze deletion patterns

### 4. Additional Security
- IP-based rate limiting
- Device fingerprinting
- SMS backup for OTP delivery

## Troubleshooting

### Common Issues

1. **"No deleted account found" error**
   - Check if the email is correct
   - Verify the account was actually deleted
   - Check if 30-day limit has expired

2. **"Invalid OTP" error**
   - Ensure OTP is entered correctly
   - Check if OTP has expired (10 minutes)
   - Request a new OTP if needed

3. **"OTP has expired" error**
   - Request a new OTP
   - Check email for the new code
   - Ensure OTP is used within 10 minutes

4. **"Cannot restore accounts deleted more than 30 days ago"**
   - The 30-day limit has expired
   - Account cannot be restored

5. **"Email address not verified" error after restoration**
   - **FIXED**: Email verification status is now preserved during restoration
   - The system maintains `email_verified_at` timestamp during OTP generation
   - Users can login immediately after account restoration

### Debug Steps

1. Check backend logs for detailed error messages
2. Verify database connectivity
3. Confirm the user exists and has `deleted_at` timestamp
4. Check OTP generation and email sending
5. Verify OTP verification logic
6. **For email verification issues**: Check that `email_verified_at` is preserved

### Email Verification Fix

**Issue**: Previously, when sending OTP for account restoration, the system would clear the `email_verified_at` field, causing users to get "Email address not verified" errors after restoration.

**Solution**: 
- Created separate `set_restore_otp_and_expiry_time()` function that preserves email verification status
- Updated restore account OTP controller to use the new function
- Added fallback logic to set `email_verified_at` if it's missing during restoration

**Files Modified**:
- `backend/app/crud/user.py` - Added new function
- `backend/app/controllers/authentication/restore_account_otp.py` - Updated to use new function
- `backend/app/controllers/user/retrieve_user.py` - Added email verification preservation logic

## Related Files

### Backend
- `backend/app/controllers/authentication/restore_account_otp.py`
- `backend/app/controllers/user/retrieve_user.py`
- `backend/app/routers/auth.py`
- `backend/app/routers/users.py`
- `backend/app/services/authentication/email_service.py`
- `backend/app/models/user/user.py`

### Frontend
- `frontend/app/RestoreAccount/page.tsx`
- `frontend/app/RestoreAccount/components/RestoreAccountForm.tsx`
- `frontend/app/RestoreAccountOTP/page.tsx`
- `frontend/app/RestoreAccountOTP/components/RestoreAccountOTPForm.tsx`
- `frontend/app/services/userService.ts`
- `frontend/app/Login/components/LoginForm.tsx`
- `frontend/app/ProfileInfo/components/ProfileForm.tsx`

### Testing
- `test_restore_user_otp.py`
- `RESTORE_ACCOUNT_FEATURE.md` 