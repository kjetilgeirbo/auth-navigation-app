# Feide Authentication with DEMOMODUS Overlay - Complete Implementation Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Core Concepts](#core-concepts)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Complete Code Files](#complete-code-files)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This implementation provides a **triple authentication system** where:
- **Feide users** can verify their access WITHOUT creating Cognito accounts (direct OAuth)
- **Email users** can authenticate using passwordless Cognito with email codes
- **Admin users** authenticate via Cognito and get assigned to admin group
- Content is overlaid with "DEMOMODUS" text for non-verified/non-authenticated users

### Key Features
✅ Direct Feide OAuth (bypasses Cognito completely for verification)
✅ Cognito passwordless email authentication (6-digit code via email)
✅ DEMOMODUS overlay on content for non-verified users
✅ Persistent verification via localStorage (Feide) and Cognito sessions (email users)
✅ Admin group management via Cognito
✅ Works with Server-Side Rendering (SSR)

---

## Architecture

### Authentication Flow

The system supports **three authentication methods**:

#### Method 1: Feide Verification (No Cognito)
```
┌─────────────┐
│   User      │
│  Visits     │
│   Page      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  DEMOMODUS Overlay Visible  │
│  "Logg inn med Feide" Button│
└──────┬──────────────────────┘
       │ Click
       ▼
┌────────────────────────────┐
│  Direct to Feide OAuth     │
│  auth.dataporten.no        │
└──────┬─────────────────────┘
       │ Authenticate
       ▼
┌────────────────────────────┐
│  Redirect back with code   │
│  URL: /page?code=xxx       │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│  FeideTracking detects     │
│  Sets localStorage flag    │
│  Dispatches event          │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│  Overlay component         │
│  hides DEMOMODUS           │
│  Shows "✅ Bekreftet"      │
└────────────────────────────┘
```

#### Method 2: Passwordless Email (Cognito)
```
┌─────────────┐
│   User      │
│  Visits     │
│  /auth      │
└──────┬──────┘
       │
       ▼
┌──────────────────────────┐
│  Enter email address     │
│  Click "Send code"       │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Cognito sends 6-digit   │
│  code via SES email      │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  User enters code        │
│  Submits verification    │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Cognito validates code  │
│  Creates/retrieves user  │
│  Returns auth tokens     │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  User redirected to      │
│  /galleri (no overlay)   │
└──────────────────────────┘
```

#### Method 3: Admin Users (Cognito + Group)
Same as Method 2, but users are added to "admin" group via post-confirmation trigger.
Admin users get access to `/admin` and `/admin/galleri` pages.

### Data Storage Strategy

**localStorage** (persistent across sessions):
- Key: `cameViaFeide`
- Value: `"true"` | `null`
- Purpose: Remember verification across browser sessions

**sessionStorage** (temporary):
- Key: `feideSession`
- Value: timestamp string
- Purpose: Track current session verification

**IMPORTANT**: No user identity data is stored. Only verification status.

---

## Prerequisites

### 1. AWS Amplify Gen 2 Setup (for Email Authentication)

**Required only if implementing Cognito passwordless email auth**

You need AWS Amplify Gen 2 backend with:
- Cognito User Pool configured for custom authentication
- Amazon SES verified domain/email for sending codes
- Lambda triggers for custom auth challenge flow

**Amplify Auth Configuration** (`amplify/auth/resource.ts`):
```typescript
import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: true, // Enable email login
  },
  triggers: {
    defineAuthChallenge,      // Determine which challenge to present
    createAuthChallenge,      // Generate and send 6-digit code
    verifyAuthChallengeResponse, // Validate the code
    preSignUp,                // Auto-confirm users
    postConfirmation,         // Optional: assign to groups
  },
});
```

**Amazon SES Setup:**
1. Verify your sender email or domain in AWS SES
2. Move out of SES Sandbox (for production)
3. Set `SES_FROM_EMAIL` environment variable (e.g., `noreply@yourdomain.com`)

---

### 2. Feide Application Setup
You need a registered Feide application at https://dashboard.feide.no

**Required Configuration:**
```
Application Name: [Your App Name]
Test Users Enabled: Yes
Attribute Groups:
  - userid-feide (Feide user identifiers)
  - email (Email address)

Redirect URIs:
  - http://localhost:3000/[your-page]  # Development
  - https://[your-domain]/[your-page]  # Production

Logout URLs:
  - http://localhost:3000/
  - https://[your-domain]/
```

**You will receive:**
- Client ID (e.g., `b6a97318-be39-4c55-9599-e5aa7d2f991f`)
- Client Secret (e.g., `04daac2b-f8cd-4057-8220-7431e40933c2`)

### 2. Test Users
Feide provides test users in realm `testusers.feide.no`

**Universal Test Password:** `098asd`

**Example Test User:**
- Username: `alexander123elev@testusers.feide.no`
- Password: `098asd`
- Name: Alexander Hansen
- Type: Student

---

## Core Concepts

### 1. Direct OAuth (No Cognito)
Unlike typical AWS Amplify setups, this implementation **bypasses Cognito entirely** for Feide users:

```typescript
// ❌ NOT USED: Amplify's signInWithRedirect
// ✅ USED: Direct browser navigation
window.location.href = 'https://auth.dataporten.no/oauth/authorization?...'
```

### 2. Verification Detection
Multiple methods detect Feide return:

```typescript
// Method 1: OAuth code parameter
urlParams.get('code')

// Method 2: State parameter
urlParams.get('state')

// Method 3: URL contains 'feide'
currentUrl.includes('feide')

// Method 4: Referrer check
document.referrer.includes('feide') || document.referrer.includes('dataporten')
```

### 3. Event-Driven Updates
Components communicate via custom events:

```typescript
// Dispatch
window.dispatchEvent(new Event('feideStatusChanged'));

// Listen
window.addEventListener('feideStatusChanged', handler);
```

### 4. Overlay Logic
The overlay shows when BOTH conditions are true:
- User is NOT authenticated via Cognito
- User has NOT verified via Feide

```typescript
const shouldShowOverlay = !isAuthenticated && !isFromFeide;
```

### 5. Cognito Passwordless Email Authentication

**How it works:**
1. User enters email address
2. System tries to sign in with CUSTOM_WITHOUT_SRP flow
3. If user doesn't exist, automatically creates account
4. Cognito sends 6-digit code via Amazon SES
5. User enters code to complete authentication
6. Cognito returns auth tokens (stored in browser)

**Key Components:**

**Amplify Auth Triggers (Lambda functions):**
- `defineAuthChallenge` - Determines which challenge to present
- `createAuthChallenge` - Generates 6-digit code and sends email via SES
- `verifyAuthChallenge` - Validates the code entered by user
- `preSignUp` - Auto-confirms new users (no separate email verification)
- `postConfirmation` - Optionally adds users to admin group

**Email Template:**
```html
<h2>Velkommen til [App Name]</h2>
<p>Din innloggingskode er:</p>
<h1 style="font-size: 36px; letter-spacing: 8px;">[6-DIGIT-CODE]</h1>
<p>Denne koden er gyldig i 15 minutter.</p>
```

**Authentication Flow Code:**
```typescript
// Step 1: Try to sign in
const signInResult = await signIn({
  username: email,
  options: {
    authFlowType: 'CUSTOM_WITHOUT_SRP', // Passwordless flow
  },
});

// Step 2: If user doesn't exist, create account
if (signInError.name === 'UserNotFoundException') {
  await signUp({
    username: email,
    password: 'dummy', // Not used, triggers will handle
    options: {
      userAttributes: { email }
    }
  });
  // Then sign in again (code will be sent)
}

// Step 3: User receives custom challenge
if (signInResult.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE') {
  // Show code input field
}

// Step 4: Confirm with code
const result = await confirmSignIn({
  challengeResponse: code, // 6-digit code from email
});

// Step 5: User is now authenticated
if (result.isSignedIn) {
  // Tokens are automatically stored by Amplify
  // Check session with fetchAuthSession()
}
```

**Session Management:**
```typescript
// Check if user is authenticated
const session = await fetchAuthSession();
if (session?.tokens?.idToken) {
  // User is signed in
  const email = session.tokens.idToken.payload.email;
  const groups = session.tokens.idToken.payload['cognito:groups'];
}
```

**Logout:**
```typescript
await signOut(); // Clears all Cognito tokens
window.dispatchEvent(new Event('authStatusChanged')); // Notify components
```

---

## Step-by-Step Implementation

### Step 1: Create FeideTracking Component

**File:** `components/FeideTracking.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import styles from './FeideTracking.module.css';

export default function FeideTracking() {
  const [isFromFeide, setIsFromFeide] = useState(false);

  useEffect(() => {
    // Check for Feide status (both persistent and session-based)
    const fromFeide = localStorage.getItem('cameViaFeide') === 'true' ||
                     sessionStorage.getItem('feideSession') === 'true';
    setIsFromFeide(fromFeide);

    // Check if user came back from Feide (check for any Feide-related parameters)
    const urlParams = new URLSearchParams(window.location.search);
    const currentUrl = window.location.href;

    // If coming from Feide (check for various return scenarios)
    if (urlParams.get('code') ||
        urlParams.get('state') ||
        currentUrl.includes('feide') ||
        document.referrer.includes('feide') ||
        document.referrer.includes('dataporten')) {
      // Mark as came via Feide (both persistent and session-based)
      localStorage.setItem('cameViaFeide', 'true');
      sessionStorage.setItem('feideSession', Date.now().toString());
      setIsFromFeide(true);

      // Dispatch event to notify other components
      window.dispatchEvent(new Event('feideStatusChanged'));

      // Clean up URL parameters
      if (urlParams.get('code') || urlParams.get('state')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleFeideClick = () => {
    // IMPORTANT: Replace these values with YOUR Feide application credentials
    const FEIDE_CLIENT_ID = 'YOUR_FEIDE_CLIENT_ID'; // e.g., 'b6a97318-be39-4c55-9599-e5aa7d2f991f'
    const REDIRECT_URI = window.location.origin + window.location.pathname; // Current page

    // Direct link to Feide OAuth without going through Cognito
    const feideUrl = 'https://auth.dataporten.no/oauth/authorization?' +
      `client_id=${FEIDE_CLIENT_ID}` +
      '&response_type=code' +
      '&scope=openid profile userid email' +
      '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
      '&state=feide_verification';

    // Navigate to Feide
    window.location.href = feideUrl;
  };

  return (
    <div className={styles.container}>
      {!isFromFeide ? (
        <>
          <button
            onClick={handleFeideClick}
            className={styles.feideButton}
            type="button"
          >
            Logg inn med Feide
          </button>
          <p className={styles.info}>
            🔓 Du kan bruke siden som gjest<br />
            ✅ Bekreft med Feide for å fjerne overlay
          </p>
        </>
      ) : (
        <div className={styles.confirmedBox}>
          <p className={styles.confirmedTitle}>✅ Bekreftet via Feide</p>
          <p className={styles.confirmedInfo}>
            Du har bekreftet din tilgang via Feide. Ingen personopplysninger er lagret.
          </p>
        </div>
      )}
    </div>
  );
}
```

**File:** `components/FeideTracking.module.css`

```css
.container {
  width: 100%;
}

.feideButton {
  width: 100%;
  padding: 14px;
  background: transparent;
  color: #ffffff;
  border: 1px solid #727272;
  border-radius: 500px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.feideButton:hover {
  border-color: #ffffff;
}

.info {
  margin-top: 16px;
  color: #a7a7a7;
  font-size: 14px;
  text-align: center;
  line-height: 1.5;
}

.confirmedBox {
  padding: 16px;
  background: rgba(30, 215, 96, 0.1);
  border: 1px solid rgba(30, 215, 96, 0.3);
  border-radius: 8px;
  color: #1ed760;
  text-align: center;
}

.confirmedTitle {
  font-weight: 700;
  margin-bottom: 4px;
}

.confirmedInfo {
  font-size: 14px;
  color: #a7a7a7;
}
```

---

### Step 2: Create Content Component with Overlay

**Example: Gallery Component**

**File:** `app/[your-page]/components/ContentWithOverlay.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';

interface ContentWithOverlayProps {
  items: Array<{
    id: string;
    url: string;
    title?: string;
  }>;
  showDemoOverlay: boolean; // Passed from server component
}

export default function ContentWithOverlay({ items, showDemoOverlay }: ContentWithOverlayProps) {
  const [isFromFeide, setIsFromFeide] = useState(false);

  useEffect(() => {
    // Check if user came via Feide
    const checkFeideStatus = () => {
      const fromFeide = localStorage.getItem('cameViaFeide') === 'true' ||
                       sessionStorage.getItem('feideSession') === 'true';
      setIsFromFeide(fromFeide);
    };

    checkFeideStatus();

    // Listen for Feide status changes
    const handleFeideStatusChange = () => {
      checkFeideStatus();
    };

    window.addEventListener('feideStatusChanged', handleFeideStatusChange);

    return () => {
      window.removeEventListener('feideStatusChanged', handleFeideStatusChange);
    };
  }, []);

  // Show demo overlay if not authenticated AND not from Feide
  const shouldShowOverlay = showDemoOverlay && !isFromFeide;

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <div key={item.id} className={styles.card}>
          {/* Your content here */}
          <img src={item.url} alt={item.title || 'Content'} className={styles.image} />

          {/* DEMOMODUS Overlay */}
          {shouldShowOverlay && (
            <div className={styles.demoOverlay}>
              <span className={styles.demoText}>DEMOMODUS</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

**File:** `app/[your-page]/page.module.css`

```css
.card {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  background: #f5f5f5;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* DEMOMODUS Overlay */
.demoOverlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 25%; /* Covers top 25% of content */
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  pointer-events: none; /* Allows clicks to pass through */
}

.demoText {
  color: #333;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: 0.9;
}
```

---

### Step 3: Create Server Component Page

**File:** `app/[your-page]/page.tsx`

```typescript
import ContentWithOverlay from './components/ContentWithOverlay';
import FeideTracking from '@/components/FeideTracking';
import styles from './page.module.css';

export default async function YourPage() {
  // Optional: Check Cognito authentication server-side
  // For pages that don't use Cognito, set isAuthenticated = false
  const isAuthenticated = false;

  // Fetch your content server-side
  const items = [
    // Your data here
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your Page Title</h1>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No content yet</h2>
          <p>Content will appear here when available.</p>
        </div>
      ) : (
        <>
          {/* Content with overlay */}
          <ContentWithOverlay
            items={items}
            showDemoOverlay={!isAuthenticated}
          />

          {/* Feide login button */}
          {!isAuthenticated && (
            <div className={styles.feideContainer}>
              <FeideTracking />
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

---

### Step 4: Create PasswordlessAuth Component (Optional - for Cognito Email Auth)

**Note:** This step is **optional**. Implement this if you want to offer email-based authentication in addition to Feide verification.

**File:** `components/PasswordlessAuth.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { signUp, signIn, signOut, fetchAuthSession, confirmSignIn } from 'aws-amplify/auth';
import styles from './PasswordlessAuth.module.css';

export default function PasswordlessAuth() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@')) {
      setMessage('Vennligst skriv inn en gyldig e-postadresse');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Try to sign in with custom auth flow
      try {
        const signInResult = await signIn({
          username: email,
          options: {
            authFlowType: 'CUSTOM_WITHOUT_SRP', // Passwordless
          },
        });

        if (signInResult.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE') {
          setShowVerification(true);
          setMessage('Vi har sendt en innloggingskode til din e-post');
        }
      } catch (signInError: any) {
        // User doesn't exist, create account
        if (signInError.name === 'UserNotFoundException' ||
            signInError.name === 'NotAuthorizedException') {

          // Generate dummy password (not used)
          const dummyPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

          await signUp({
            username: email,
            password: dummyPassword,
            options: {
              userAttributes: { email },
            },
          });

          // Sign in again after signup
          const signInResult = await signIn({
            username: email,
            options: {
              authFlowType: 'CUSTOM_WITHOUT_SRP',
            },
          });

          if (signInResult.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE') {
            setShowVerification(true);
            setMessage('Velkommen! Vi har sendt en verifiseringskode til din e-post');
          }
        } else {
          throw signInError;
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setMessage('Feil: ' + (error.message || 'Kunne ikke sende verifiseringskode'));
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (!code || code.length !== 6) {
      setMessage('Vennligst skriv inn 6-sifret kode');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await confirmSignIn({
        challengeResponse: code,
      });

      if (result.isSignedIn) {
        setShowVerification(false);
        setMessage('Velkommen! Du er nå innlogget.');

        // Dispatch event for navigation update
        window.dispatchEvent(new Event('authStatusChanged'));

        // Redirect to gallery
        window.location.href = '/galleri';
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setMessage('Feil: Ugyldig kode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {!showVerification ? (
        <>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">
              E-postadresse
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="navn@domene.no"
              onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
              className={styles.input}
              disabled={loading}
            />
          </div>
          <button
            onClick={handleEmailSubmit}
            disabled={!email || loading}
            className={styles.button}
          >
            {loading ? 'Sender...' : 'Send innloggingskode'}
          </button>
        </>
      ) : (
        <>
          <h2 className={styles.verificationTitle}>Verifiser e-post</h2>
          <p className={styles.verificationInfo}>
            Vi har sendt en kode til <strong>{email}</strong>
          </p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            onKeyPress={(e) => e.key === 'Enter' && handleCodeSubmit()}
            className={styles.codeInput}
            disabled={loading}
          />
          <button
            onClick={handleCodeSubmit}
            disabled={!code || code.length !== 6 || loading}
            className={styles.button}
          >
            {loading ? 'Verifiserer...' : 'Bekreft kode'}
          </button>
          <button
            onClick={() => {
              setShowVerification(false);
              setCode('');
              setMessage('');
            }}
            className={styles.backButton}
          >
            Tilbake
          </button>
        </>
      )}
      {message && (
        <div className={styles.message}>
          {message}
        </div>
      )}
    </div>
  );
}
```

**File:** `components/PasswordlessAuth.module.css`

```css
.container {
  width: 100%;
  max-width: 400px;
}

.inputGroup {
  margin-bottom: 1rem;
}

.label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.input,
.codeInput {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.codeInput {
  text-align: center;
  font-size: 24px;
  letter-spacing: 0.5em;
  font-weight: bold;
}

.button {
  width: 100%;
  padding: 12px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.button:hover:not(:disabled) {
  background: #1976d2;
}

.button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.backButton {
  width: 100%;
  padding: 12px;
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  margin-top: 0.5rem;
}

.verificationTitle {
  margin-bottom: 0.5rem;
  color: #333;
}

.verificationInfo {
  margin-bottom: 1.5rem;
  color: #666;
  font-size: 14px;
}

.message {
  margin-top: 1rem;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  background: #e3f2fd;
  color: #1976d2;
}

.messageError {
  background: #ffebee;
  color: #c62828;
}
```

---

### Step 5: Create Auth Page (Optional - combines both auth methods)

**File:** `app/auth/page.tsx`

```typescript
'use client';

import PasswordlessAuth from '@/components/PasswordlessAuth';
import FeideTracking from '@/components/FeideTracking';
import styles from './page.module.css';

export default function AuthPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Logg inn</h1>

      <div className={styles.authBox}>
        {/* Email authentication */}
        <PasswordlessAuth />

        {/* Divider */}
        <div className={styles.divider}>
          <span>eller</span>
        </div>

        {/* Feide verification */}
        <FeideTracking />
      </div>
    </div>
  );
}
```

**File:** `app/auth/page.module.css`

```css
.container {
  max-width: 500px;
  margin: 4rem auto;
  padding: 2rem;
}

.title {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
  color: #333;
}

.authBox {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.divider {
  margin: 2rem 0;
  text-align: center;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background: #ddd;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  background: white;
  padding: 0 1rem;
  color: #666;
  font-size: 14px;
}
```

---

## Complete Code Files

### Navigation Integration (Optional)

If you want to show Feide status in navigation:

**File:** `components/Navigation.tsx` (relevant excerpt)

```typescript
const [isFromFeide, setIsFromFeide] = useState(false);

useEffect(() => {
  // Check Feide status
  const checkFeideStatus = () => {
    const fromFeide = localStorage.getItem('cameViaFeide') === 'true' ||
                     sessionStorage.getItem('feideSession') === 'true';
    setIsFromFeide(fromFeide);
  };

  checkFeideStatus();

  // Listen for Feide status changes
  const handleFeideStatusChange = () => {
    checkFeideStatus();
  };

  window.addEventListener('feideStatusChanged', handleFeideStatusChange);

  return () => {
    window.removeEventListener('feideStatusChanged', handleFeideStatusChange);
  };
}, []);

const handleLogout = async () => {
  // Clear Feide session markers
  localStorage.removeItem('cameViaFeide');
  sessionStorage.removeItem('feideSession');

  // Dispatch events to update all components
  window.dispatchEvent(new Event('feideStatusChanged'));

  // Reload page
  window.location.href = '/';
};

// In your status display
const getUserStatus = () => {
  if (isFromFeide) {
    return '✓ Feide-bekreftet';
  }
  return 'Gjest';
};
```

---

## Testing & Verification

### Test Checklist

#### 1. Initial Page Load
- [ ] DEMOMODUS overlay is visible on content
- [ ] "Logg inn med Feide" button is visible
- [ ] Guest message is shown

#### 2. Feide Login Flow
- [ ] Clicking Feide button navigates to `auth.dataporten.no`
- [ ] Can select "Feide testbrukere" option
- [ ] Can login with test user (password: `098asd`)
- [ ] Redirects back to original page with `?code=` parameter
- [ ] URL parameter is cleaned up automatically

#### 3. After Verification
- [ ] DEMOMODUS overlay is hidden
- [ ] "✅ Bekreftet via Feide" message shows
- [ ] Content is fully visible
- [ ] Verification persists on page refresh

#### 4. Browser Storage
```javascript
// Check in browser console
localStorage.getItem('cameViaFeide') // Should be "true"
sessionStorage.getItem('feideSession') // Should be timestamp
```

#### 5. Event Dispatch
```javascript
// Check in browser console
window.addEventListener('feideStatusChanged', () => {
  console.log('Feide status changed!');
});
```

### Manual Testing Steps

1. **Clear browser storage:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Visit your page** - Should see overlay

3. **Click "Logg inn med Feide"** - Should redirect to Feide

4. **Login with test user:**
   - Username: `alexander123elev@testusers.feide.no`
   - Password: `098asd`

5. **Verify redirect** - Should return to your page

6. **Check overlay** - Should be hidden

7. **Refresh page** - Overlay should stay hidden

8. **Open new tab** - Visit same page, overlay should stay hidden

9. **Clear storage and refresh** - Overlay should reappear

---

## Troubleshooting

### Issue: Overlay doesn't hide after Feide login

**Causes:**
1. URL parameters not detected
2. localStorage not being set
3. Event not dispatched
4. Component not listening to event

**Solution:**
```javascript
// Add debug logging in FeideTracking useEffect
console.log('URL params:', window.location.search);
console.log('Referrer:', document.referrer);
console.log('localStorage:', localStorage.getItem('cameViaFeide'));
console.log('sessionStorage:', sessionStorage.getItem('feideSession'));
```

### Issue: Redirect URI mismatch

**Error in Feide:** "redirect_uri_mismatch"

**Solution:**
1. Check Feide application settings at https://dashboard.feide.no
2. Ensure redirect URI EXACTLY matches your page URL
3. Include both http://localhost:3000 (dev) and production URLs
4. Make sure there's no trailing slash mismatch

### Issue: Event not received in component

**Cause:** Component mounted before event dispatched

**Solution:**
```typescript
useEffect(() => {
  // Initial check
  checkFeideStatus();

  // Then listen for changes
  window.addEventListener('feideStatusChanged', checkFeideStatus);

  return () => {
    window.removeEventListener('feideStatusChanged', checkFeideStatus);
  };
}, []); // Empty dependency array - run once on mount
```

### Issue: Overlay flickers on page load

**Cause:** Client component checks localStorage after server render

**Solution:**
```typescript
const [isFromFeide, setIsFromFeide] = useState(false);
const [isHydrated, setIsHydrated] = useState(false);

useEffect(() => {
  setIsHydrated(true);
  checkFeideStatus();
}, []);

// Only show overlay after hydration
const shouldShowOverlay = isHydrated && showDemoOverlay && !isFromFeide;
```

### Issue: "Cannot read properties of null (reading 'getItem')"

**Cause:** Server-side execution trying to access localStorage

**Solution:** Always use localStorage in client components with `'use client'` directive

```typescript
'use client'; // ← IMPORTANT!

import { useEffect, useState } from 'react';
```

---

## Configuration Checklist

Before deploying to production:

- [ ] Replace `YOUR_FEIDE_CLIENT_ID` with actual client ID
- [ ] Add production redirect URI to Feide application settings
- [ ] Test with real Feide test users
- [ ] Verify logout clears all storage
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices
- [ ] Verify SSR works correctly (check page source for pre-rendered content)
- [ ] Test with browser dev tools → Application → Storage to verify flags

---

## Key Implementation Rules

### DO ✅
1. **Always check both localStorage AND sessionStorage** for Feide status
2. **Dispatch events** when Feide status changes
3. **Clean up URL parameters** after detecting Feide return
4. **Use 'use client'** directive for components accessing browser APIs
5. **Check multiple conditions** for Feide return detection
6. **Remove pointer-events** on overlay so content remains clickable

### DON'T ❌
1. **Don't use Cognito OAuth** for Feide (direct navigation only)
2. **Don't store user identity data** (only verification boolean)
3. **Don't process the OAuth code** (we don't need tokens)
4. **Don't use server-side storage** for Feide verification
5. **Don't forget to clean up event listeners** in useEffect
6. **Don't make overlay block all interactions** (use pointer-events: none)

---

## Summary

This implementation provides a lightweight Feide verification system that:
- Works independently of Cognito
- Stores minimal data (only verification status)
- Provides visual feedback via DEMOMODUS overlay
- Persists verification across sessions
- Integrates seamlessly with SSR/Next.js
- Requires minimal backend configuration

The key is the **dual-check system** (Cognito auth OR Feide verification) and the **event-driven architecture** that keeps all components synchronized.

---

## Additional Notes

### Performance Considerations
- Overlay renders server-side (no flash of content)
- localStorage check is synchronous (fast)
- Event system is lightweight (no polling)

### Security Considerations
- No user data stored locally
- OAuth code is not processed (stateless verification)
- Verification state is client-side only (not trusted for backend)
- Use Cognito for any operations requiring authentication

### Accessibility
- Overlay doesn't block screen readers
- pointer-events: none allows interaction
- Clear visual indicator (high contrast text)
- Button has proper focus states

### Browser Compatibility
- localStorage: IE 8+
- sessionStorage: IE 8+
- Custom events: IE 9+
- Backdrop filter: Modern browsers (Safari, Chrome, Firefox)
