# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AWS Amplify Gen 2 + Next.js app with Norwegian interface implementing a **dual authentication system**:
1. **Cognito passwordless email authentication** (6-digit code via email) for both regular users and admins
2. **Direct Feide OAuth verification** (bypasses Cognito) for content access

Admin users are automatically assigned to the "admin" group via a `postConfirmation` Lambda trigger when their email matches a hardcoded list.

## Core Development Commands

```bash
# Install dependencies
npm install

# Start AWS Amplify sandbox (run in first terminal)
npx ampx sandbox

# Start Next.js development server (run in second terminal)
npm run dev

# Build for production
npm run build

# Run linting
npm lint

# Run type checking
npm run typecheck

# Deploy to AWS production
npx ampx sandbox --identifier production
```

## Architecture Overview

### Backend Structure (AWS Amplify Gen 2)

The backend uses Amplify Gen 2's `defineBackend` pattern:
- **`amplify/backend.ts`** - Central backend configuration that imports and combines auth, data, and storage resources
- **`amplify/auth/resource.ts`** - Defines Cognito authentication with passwordless email (custom auth flow) and Feide OAuth config
- **`amplify/auth/post-confirmation/handler.ts`** - Lambda trigger that assigns users to "admin" group based on hardcoded email list
- **`amplify/auth/create-auth-challenge/handler.ts`** - Lambda trigger that generates and sends 6-digit codes via SES
- **`amplify/auth/verify-auth-challenge/handler.ts`** - Lambda trigger that validates 6-digit codes
- **`amplify/data/resource.ts`** - Defines GraphQL schema with DynamoDB tables using `defineData`
- **`amplify/storage/resource.ts`** - Defines S3 storage for gallery images with access rules
- **`amplify_outputs.json`** - Auto-generated configuration file containing AWS resource IDs and endpoints (DO NOT edit manually)

### Frontend Architecture

The app uses Next.js 14 App Router with mixed SSR and client-side patterns:
- **Root Layout** (`app/layout.tsx`) - Wraps entire app in `Authenticator.Provider` and includes Navigation and OAuthListener
- **Navigation Component** (`components/Navigation.tsx`) - Responsive navigation with hamburger menu, shows admin links for admin group members
- **PasswordlessAuth Component** (`components/PasswordlessAuth.tsx`) - Handles Cognito passwordless email authentication with 6-digit codes
- **FeideTracking Component** (`components/FeideTracking.tsx`) - Handles direct Feide OAuth verification (bypasses Cognito)
- **Gallery Pages** (`app/galleri/page.tsx`, `app/admin/galleri/page.tsx`) - SSR pages with S3 image listings and DEMOMODUS overlay for non-authenticated users
- **Auth Page** (`app/auth/page.tsx`) - Combines both PasswordlessAuth and FeideTracking for unified login experience

### Authentication Flows

**Method 1: Cognito Passwordless Email (for regular users and admins)**
1. User enters email on `/auth` page
2. System tries `signIn` with `CUSTOM_WITHOUT_SRP` flow
3. If user doesn't exist, automatically creates account with `signUp`
4. Lambda trigger (`create-auth-challenge`) generates 6-digit code and sends via SES
5. User enters code to verify
6. Lambda trigger (`verify-auth-challenge`) validates the code
7. Upon success, `postConfirmation` trigger checks email against hardcoded admin list
8. If email matches, user is added to "admin" group in Cognito
9. User is redirected to `/galleri` (regular) or `/admin/galleri` (admin)

**Method 2: Feide Verification (bypasses Cognito)**
1. User clicks "Logg inn med Feide" button on gallery page
2. Browser navigates directly to Feide OAuth endpoint with client credentials
3. User authenticates with Feide (test users: `testusers.feide.no`, password `098asd`)
4. Feide redirects back to `/galleri` with `code` and `state` parameters
5. `FeideTracking` component detects return and sets `localStorage.cameViaFeide = 'true'`
6. DEMOMODUS overlay is hidden on gallery content (no Cognito session created)

**Key Difference:**
- Feide verification only removes content overlays, does NOT create Cognito users
- Cognito authentication creates actual user sessions with tokens
- Admin users are determined by email match in `postConfirmation` trigger, not a separate auth method

## Key Technical Decisions

- **Dual authentication system** - Cognito passwordless email AND direct Feide OAuth verification
- **No passwords** - Custom auth flow with 6-digit codes sent via email (no traditional passwords)
- **Feide bypasses Cognito** - Direct OAuth navigation, only stores verification boolean in localStorage
- **Admin group assignment** - Automatic via `postConfirmation` Lambda trigger based on hardcoded email list
- **DEMOMODUS overlay** - Visual indicator on content for non-authenticated/non-verified users
- **Event-driven updates** - Components sync via `window.dispatchEvent` for `authStatusChanged` and `feideStatusChanged`
- **Norwegian interface** - All UI text is in Norwegian, HTML `lang="no"`
- **Responsive design** - Navigation includes hamburger menu for mobile devices
- **SSR for galleries** - Server-side rendering with S3 image fetching for better performance
- **Storage access control** - S3 bucket with identity pool and guest access for public gallery

## Environment-Specific Notes

- Amplify sandbox creates temporary AWS resources prefixed with your identifier (default: your computer username)
- Each developer gets their own isolated backend when running `npx ampx sandbox`
- The `amplify_outputs.json` file is environment-specific and contains the endpoints for your current sandbox

## Common Issues and Solutions

- **SWC Binary Error**: If you see "Failed to load SWC binary", this is a Next.js warning that can be ignored - the app will still work
- **Amplify Sandbox Port**: Sandbox runs on various ports for different services - the main GraphQL API endpoint is shown in terminal output
- **Module Not Found (lodash)**: Clean reinstall with `rm -rf node_modules package-lock.json && npm install`

## Testing Authentication

### Testing Cognito Passwordless Email Auth:
1. Navigate to `/auth` page
2. Enter any valid email address (real email not required in sandbox)
3. Check terminal for 6-digit code (printed in Lambda logs)
4. Enter the 6-digit code to complete authentication
5. If email matches admin list in `post-confirmation/handler.ts`, user gets admin access
6. Auth tokens stored in browser localStorage under `aws-amplify` keys
7. Admin users redirected to `/admin/galleri`, regular users to `/galleri`

### Testing Feide Verification:
1. Navigate to `/galleri` page (DEMOMODUS overlay should be visible)
2. Click "Logg inn med Feide" button (if not already verified)
3. Navigate to Feide OAuth, select "Feide testbrukere"
4. Login with test user (e.g., `alexander123elev`, password `098asd`)
5. Redirect back to `/galleri` with URL parameters
6. Verify DEMOMODUS overlay is now hidden
7. Check `localStorage.cameViaFeide` should be `"true"`
8. Refresh page - overlay should stay hidden (persistent verification)

## Feide Integration Documentation

When implementing Feide OpenID Connect authentication, use the following documentation:

### Primary Feide Documentation
- **OpenID Connect Details**: https://docs.feide.no/reference/oauth_oidc/openid_connect_details.html
  - Discovery endpoint: `https://auth.dataporten.no/.well-known/openid-configuration`
  - Authorization flow: Authorization Code with PKCE
  - ID token validation requirements (issuer, audience)
  - Supported flows: Authorization Code and Hybrid
  - Signature: RS256 PKI

- **UserIDs Structure**: https://docs.feide.no/reference/oauth_oidc/userids.html
  - Primary UUID format for user identification
  - Secondary IDs (feide:username@org.no format)
  - Handling multiple user identifiers
  - National identity number claim: `https://n.feide.no/claims/nin`

- **Service Provider Integration**: https://docs.feide.no/service_providers/openid_connect/index.html
  - Registration in Feide customer portal required
  - Redirect URI configuration
  - Attribute group permissions
  - Security considerations

- **OAuth/OIDC Reference**: https://docs.feide.no/reference/oauth_oidc/index.html
  - Complete OAuth 2.0 and OpenID Connect implementation overview
  - Logout functionality
  - Token management

- **APIs Overview**: https://docs.feide.no/reference/apis/index.html
  - Feide API for user information
  - Groups API for organizational data
  - OpenID Connect userinfo endpoint
  - Rate limiting considerations

- **Test Users**: https://docs.feide.no/reference/testusers.html
  - Test realm: `testusers.feide.no`
  - Universal password: `098asd`
  - Various user types (students, teachers, staff)
  - Multiple organizational affiliations for testing
  - **Primary test user for this project**:
    - Bruker: `alexander123elev@testusers.feide.no`
    - Passord: `098asd`
    - Name: Alexander Hansen
    - Type: Student at Bjerke grunnskole
    - Use this account for all Feide login testing

### AWS Amplify OIDC Integration
- **External Identity Providers**: https://docs.amplify.aws/nextjs/build-a-backend/auth/concepts/external-identity-providers/
  - Configure OIDC provider in `amplify/auth/resource.ts`
  - Use `signInWithRedirect` API for Feide login
  - Set up OAuth listener for multi-page apps

### Key Implementation Points
1. **Feide OIDC Configuration**:
   - issuerUrl: `https://auth.dataporten.no`
   - Required scopes: `openid`, `profile`, `userid`, `email`
   - Callback URLs must match Feide portal configuration

2. **Secrets Management**:
   - Use `npx ampx sandbox secret set` for Feide clientId and clientSecret
   - Never commit secrets to repository

3. **Test Users**:
   - Feide test users available in realm `testusers.feide.no`
   - Universal test password: `098asd`
   - Service must be configured to allow test users

4. **User Mapping**:
   - Map Feide UUID as primary identifier in Cognito
   - Store Feide-specific claims (organization, secondary IDs)
   - Handle attribute mapping in auth configuration

### Project-Specific Feide Implementation

**CRITICAL: Feide Integration Bypasses Cognito Entirely**

This application implements a **dual authentication system**:
1. **Cognito passwordless authentication** - for admin access and full app functionality
2. **Direct Feide verification** - for content access verification only (bypasses Cognito)

**The Feide integration is intentionally simplified and does NOT use Cognito OAuth integration.**

### How Feide Authentication Works

**Authentication Flow:**
1. User clicks "Logg inn med Feide" button on gallery page
2. Browser navigates directly to `https://auth.dataporten.no/oauth/authorization` with our client credentials
3. User authenticates with Feide (using test users: realm `testusers.feide.no`, password `098asd`)
4. Feide redirects back to `/galleri` with OAuth `code` and `state` parameters
5. `FeideTracking` component detects the return and sets `localStorage.cameViaFeide = 'true'`
6. Gallery page removes "DEMOMODUS" overlay for users with Feide verification

**Key Implementation Details:**

#### 1. FeideTracking Component (`components/FeideTracking.tsx`)
```typescript
// Direct OAuth URL construction - NO Cognito involved
const handleFeideClick = () => {
  const feideUrl = 'https://auth.dataporten.no/oauth/authorization?' +
    'client_id=b6a97318-be39-4c55-9599-e5aa7d2f991f' +
    '&response_type=code' +
    '&scope=openid profile userid email' +
    '&redirect_uri=' + encodeURIComponent(window.location.origin + '/galleri') +
    '&state=feide_verification';

  window.location.href = feideUrl; // Direct navigation, no Amplify APIs
};
```

#### 2. Return Detection and Session Storage
```typescript
// Multiple detection methods for Feide return
if (urlParams.get('code') ||
    urlParams.get('state') ||
    currentUrl.includes('feide') ||
    document.referrer.includes('feide') ||
    document.referrer.includes('dataporten')) {

  localStorage.setItem('cameViaFeide', 'true');
  sessionStorage.setItem('feideSession', Date.now().toString());
  setIsFromFeide(true);

  // Clean up URL parameters
  if (urlParams.get('code') || urlParams.get('state')) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
```

#### 3. Gallery Access Control (`app/galleri/page.tsx`)
```typescript
// Dual authentication check
const [isAuthenticated, setIsAuthenticated] = useState(false); // Cognito auth
const [isFromFeide, setIsFromFeide] = useState(false);         // Feide verification

// Remove overlay if EITHER Cognito authenticated OR Feide verified
{!isAuthenticated && !isFromFeide && (
  <div className={styles.demoOverlay}>
    <span className={styles.demoText}>DEMOMODUS</span>
  </div>
)}
```

**IMPORTANT: What We DON'T Do:**
- ❌ We don't use Cognito's `signInWithRedirect` for Feide
- ❌ We don't process the OAuth `code` parameter for tokens
- ❌ We don't store or use any user identity data from Feide
- ❌ We don't create Cognito users from Feide authentication
- ❌ We don't use Amplify's OAuth configuration for actual Feide login

**What We DO:**
- ✅ Use direct browser navigation to Feide OAuth endpoint
- ✅ Detect successful return from Feide via URL parameters and referrer
- ✅ Store verification status in localStorage/sessionStorage
- ✅ Remove content overlays based on verification status
- ✅ Keep Cognito OAuth configuration for potential future use (currently unused)

### Why This Approach?

**User's Requirements:**
- "I en tidliger versjon så omgikk vi cognito. Det er hele poenget, vi trenger ikke å autentisere brukere fra feide. Bare sette feide session."
- "Det er med hensikt at vi kun trenger å vite at brukeren har blitt bekreftet som innlogget gjennom feide"

**Benefits:**
- **Simple**: No complex OAuth token handling or user federation
- **Fast**: Direct navigation, no additional API calls
- **Secure**: No user data stored, just verification status
- **Flexible**: Can coexist with Cognito authentication for admin features

### Component Architecture

**Files Involved in Feide Integration:**
- `components/FeideTracking.tsx` - Main Feide authentication component
- `app/galleri/page.tsx` - Gallery page with dual auth checking
- `amplify/auth/resource.ts` - Contains OAuth config (for potential future use)
- `components/OAuthListener.tsx` - Cognito OAuth listener (not used for Feide)

**Feide Application (ff-dev)**:
- **Client ID**: `b6a97318-be39-4c55-9599-e5aa7d2f991f`
- **Client Secret**: `04daac2b-f8cd-4057-8220-7431e40933c2`
- **Test Users**: Enabled
- **Attribute Groups**:
  - `userid-feide` (Feide user identifiers)
  - `email` (Email address)

**AWS Configuration**:
- **Region**: `eu-north-1`
- **Sandbox Identifier**: Use default or `feide-dev`

**Required Redirect URIs** (configured in Feide portal):
```
http://localhost:3000/galleri                    # Local development (our implementation)
http://localhost:3000/                          # Local development (Cognito, unused)
http://localhost:3000/profile                   # Local development (Cognito, unused)
https://main.deodkfzpv9kfw.amplifyapp.com/galleri # Production (our implementation)
https://main.deodkfzpv9kfw.amplifyapp.com/        # Production (Cognito, unused)
https://main.deodkfzpv9kfw.amplifyapp.com/profile # Production (Cognito, unused)

# Cognito OAuth endpoints (configured but unused by our implementation)
https://e7e6ccabdde013627bd8.auth.eu-north-1.amazoncognito.com/oauth2/idpresponse (sandbox)
https://92b274779fe70972e054.auth.eu-north-1.amazoncognito.com/oauth2/idpresponse (production)
```

**Required Logout URLs** (configured in Feide portal, but not used in our implementation):
```
http://localhost:3000/
http://localhost:3000/logout
https://main.deodkfzpv9kfw.amplifyapp.com/
https://main.deodkfzpv9kfw.amplifyapp.com/logout
```

**Setting Secrets for Local Development**:
```bash
npx ampx sandbox secret set FEIDE_CLIENT_ID
# Enter: b6a97318-be39-4c55-9599-e5aa7d2f991f

npx ampx sandbox secret set FEIDE_CLIENT_SECRET
# Enter: 04daac2b-f8cd-4057-8220-7431e40933c2
```

### Testing Feide Integration

**Manual Testing Steps:**
1. Start local development: `npm run dev` and `npx ampx sandbox`
2. Navigate to `http://localhost:3000/galleri`
3. Verify "Logg inn med Feide" button is visible (if not already verified)
4. Click the button - should navigate to `auth.dataporten.no`
5. Click "Feide testbrukere" from the options
6. Login with any testuser (e.g., `alexander123elev` with password `098asd`)
7. Should redirect back to `/galleri` with `code` and `state` parameters
8. Verify the login button is no longer visible (component shows nothing when verified)
9. Check browser localStorage: `localStorage.cameViaFeide` should be `"true"`
10. Verify gallery images no longer show "DEMOMODUS" overlay

**Testing Different Scenarios:**
- **First visit**: Shows login button, DEMOMODUS overlays visible on gallery images
- **After Feide verification**: Login button disappears, overlays hidden
- **Refresh after verification**: Verification persists (localStorage), no login button shown
- **Different browser/incognito**: Shows login button again (no localStorage)
- **Logout**: Clears both Cognito session and Feide verification flags

**Automated Testing with Playwright:**
```bash
# The project includes Playwright tests that verify:
# - Navigation to Feide authentication
# - Return detection and localStorage setting
# - UI state changes after verification
```

**Production Testing:**
- Same flow but using `https://main.deodkfzpv9kfw.amplifyapp.com/galleri`
- Feide portal already configured with production redirect URI

**Note**: The Cognito domain URLs are generated after deployment but are unused by our direct Feide implementation.