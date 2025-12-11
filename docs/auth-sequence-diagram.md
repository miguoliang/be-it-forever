# Authentication Sequence Diagram

This document describes the authentication flow for the "背它一辈子" (Be It Forever) application.

## Authentication Flow

The application uses Supabase authentication with OTP (One-Time Password) via email verification code.

```mermaid
sequenceDiagram
    actor User
    participant Client as Client Browser<br/>(Sign In Page)
    participant SupabaseClient as Supabase Client<br/>(Browser)
    participant SupabaseServer as Supabase Server<br/>(Auth Service)
    participant EmailService as Email Service
    participant AppRouter as Next.js Router

    Note over User,AppRouter: OTP Authentication Flow
    
    User->>Client: Enter email address
    User->>Client: Click "发送验证码" (Send OTP)
    
    Client->>SupabaseClient: signInWithOtp({ email, options: { shouldCreateUser: true } })
    SupabaseClient->>SupabaseServer: POST /auth/v1/otp
    
    alt Rate Limit Check
        SupabaseServer-->>SupabaseClient: Error: Rate limit exceeded<br/>(with wait time in message)
        SupabaseClient-->>Client: Parse wait time from error
        Client->>Client: Format wait time<br/>(minutes/seconds in Chinese)
        Client-->>User: Alert: "为了您的账户安全，请等待 X分Y秒后再重新发送验证码"
    else Success
        SupabaseServer->>EmailService: Send OTP email<br/>(with verification code)
        EmailService->>User: Email with OTP code
        SupabaseServer-->>SupabaseClient: Success response
        SupabaseClient-->>Client: OTP sent successfully
        Client->>Client: setOtpSent(true)
        Client-->>User: Show OTP input field<br/>Alert: "验证码已发送到您的邮箱，请查收。"
    end
    
    User->>Client: Enter OTP code
    User->>Client: Click "验证登录" (Verify Login)
    
    Client->>SupabaseClient: verifyOtp({ email, token: otp, type: "email" })
    SupabaseClient->>SupabaseServer: POST /auth/v1/verify
    
    alt Invalid OTP or Rate Limit
        SupabaseServer-->>SupabaseClient: Error response
        SupabaseClient-->>Client: Error details
        alt Rate Limit Error
            Client->>Client: Parse and format wait time
            Client-->>User: Alert: "为了您的账户安全，请等待 X分Y秒后再重试。"
        else Other Error
            Client-->>User: Alert: Error message
        end
        Client->>Client: setLoading(false)
    else Valid OTP
        SupabaseServer->>SupabaseServer: Create/Update user if needed<br/>Generate JWT token<br/>Create session
        SupabaseServer-->>SupabaseClient: Session + User data<br/>(with user_metadata.role)
        SupabaseClient->>SupabaseClient: Store session in cookies<br/>(PKCE flow enabled)
        
        Client->>Client: Check user role from data.user.user_metadata.role
        
        alt User role is "operator"
            Client->>AppRouter: router.push("/operator")
            AppRouter->>Client: Navigate to Operator Dashboard
        else User role is "learner" (default) or undefined
            Client->>AppRouter: router.push("/learn")
            AppRouter->>Client: Navigate to Learning Dashboard
        end
        Client->>Client: setLoading(false)
    end

    Note over User,AppRouter: Session Management & Auth State Monitoring
    
    Client->>SupabaseClient: Monitor auth state changes<br/>(onAuthStateChange in Providers)
    
    alt SIGNED_IN event
        SupabaseClient->>Client: Trigger SIGNED_IN event
        Client->>AppRouter: router.refresh()<br/>(only on valid routes)
    else SIGNED_OUT event
        SupabaseClient->>Client: Trigger SIGNED_OUT event
        Client->>AppRouter: router.push("/")
    end
    
    Note over SupabaseClient: Session Features:<br/>- Auto-refresh token enabled<br/>- PKCE flow for security<br/>- Session persisted in cookies<br/>- detectSessionInUrl enabled
```

## Key Components

### Client-Side Authentication
- **Location**: `src/app/page.tsx`
- **Method**: Uses Supabase client (`createClient()`) for browser-based auth
- **Features**:
  - OTP request via `signInWithOtp()` with `shouldCreateUser: true` option
  - OTP verification via `verifyOtp()` with email, token, and type
  - Rate limiting error handling with user-friendly Chinese messages
  - Role-based redirect after successful authentication
  - "重新发送验证码" (Resend OTP) button to reset and request new OTP

### Session Management
- **Client**: `src/lib/supabaseClient.ts`
  - Uses PKCE flow for enhanced security
  - Auto-refreshes tokens
  - Detects session in URL
  - Persists session in cookies

- **Server**: `src/lib/supabaseServer.ts`
  - Route handlers can modify cookies
  - Server components are read-only
  - Middleware handles session refresh

### Auth State Monitoring
- **Location**: `src/app/providers.tsx`
- **Functionality**:
  - Monitors auth state changes via `onAuthStateChange()`
  - Handles `SIGNED_IN` and `SIGNED_OUT` events
  - Automatically redirects on sign-out
  - Refreshes router on sign-in

## User Roles

- **operator**: Content managers who access `/operator` dashboard
- **learner** (default): Regular users who access `/learn` dashboard

Role is determined by `user_metadata.role` in the Supabase user object.

## Security Features

1. **PKCE Flow**: Prevents authorization code interception attacks
2. **Rate Limiting**: Prevents OTP spam (handled by Supabase)
3. **Session Cookies**: Secure, HTTP-only cookies managed by Supabase
4. **Auto Token Refresh**: Maintains session without user intervention
5. **Role-Based Access**: Different dashboards based on user role

