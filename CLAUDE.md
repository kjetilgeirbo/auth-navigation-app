# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AWS Amplify Gen 2 + Next.js authentication app with Norwegian language interface. The app implements email/password authentication using AWS Cognito and provides navigation between public and protected pages.

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
- **`amplify/backend.ts`** - Central backend configuration that imports and combines auth and data resources
- **`amplify/auth/resource.ts`** - Defines Cognito authentication with email/password, configured for Norwegian users
- **`amplify/data/resource.ts`** - Defines GraphQL schema with DynamoDB tables using `defineData`
- **`amplify_outputs.json`** - Auto-generated configuration file containing AWS resource IDs and endpoints (DO NOT edit manually)

### Frontend Architecture

The app uses Next.js 14 App Router with client-side authentication:
- **Root Layout** (`app/layout.tsx`) - Wraps entire app in `Authenticator.Provider` and includes global navigation
- **Navigation Component** (`components/Navigation.tsx`) - Horizontal top navigation that shows different options based on auth state
- **Protected Route Pattern** - Protected pages use `useAuthenticator` hook to check auth state and redirect if needed

### Authentication Flow

1. **ConfigureAmplifyClientSide** component configures Amplify with AWS resources on client-side
2. **Authenticator.Provider** in layout provides auth context to all pages
3. Pages access auth state via `useAuthenticator` hook
4. Protected pages check `user` object and redirect to home if not authenticated

## Key Technical Decisions

- **Client-side authentication only** - All components use `'use client'` directive since Amplify Auth requires client-side JavaScript
- **Norwegian interface** - All UI text is in Norwegian, HTML lang="no"
- **Email as username** - Cognito configured to use email address as both username and login identifier
- **Minimal data model** - Basic Item model with owner-based access control for demonstration

## Environment-Specific Notes

- Amplify sandbox creates temporary AWS resources prefixed with your identifier (default: your computer username)
- Each developer gets their own isolated backend when running `npx ampx sandbox`
- The `amplify_outputs.json` file is environment-specific and contains the endpoints for your current sandbox

## Common Issues and Solutions

- **SWC Binary Error**: If you see "Failed to load SWC binary", this is a Next.js warning that can be ignored - the app will still work
- **Amplify Sandbox Port**: Sandbox runs on various ports for different services - the main GraphQL API endpoint is shown in terminal output
- **Module Not Found (lodash)**: Clean reinstall with `rm -rf node_modules package-lock.json && npm install`

## Testing Authentication

When testing auth flow:
1. Create account requires valid email format and password meeting policy (8+ chars, uppercase, lowercase, number, symbol)
2. Email verification is configured but may be disabled in sandbox mode
3. Auth tokens are stored in browser localStorage under `aws-amplify` keys

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
8. Verify the component now shows "✅ Bekreftet via Feide" instead of the login button
9. Check browser localStorage: `localStorage.cameViaFeide` should be `"true"`
10. Verify gallery images no longer show "DEMOMODUS" overlay

**Testing Different Scenarios:**
- **First visit**: Shows login button, overlays visible
- **After Feide verification**: Shows confirmation, overlays hidden
- **Refresh after verification**: Verification persists (localStorage)
- **Different browser/incognito**: Shows login button again (no localStorage)

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