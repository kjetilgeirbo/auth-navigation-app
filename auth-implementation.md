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

This implementation provides a **dual authentication system** where:
- **Feide users** can verify their access WITHOUT creating Cognito accounts
- Content is overlaid with "DEMOMODUS" text for non-verified users
- **No user data is stored** - only verification status in browser storage
- Works alongside optional Cognito authentication for admin features

### Key Features
✅ Direct Feide OAuth (bypasses Cognito completely)
✅ DEMOMODUS overlay on content for non-verified users
✅ Persistent verification via localStorage
✅ Session-based tracking via sessionStorage
✅ No personal data storage
✅ Works with Server-Side Rendering (SSR)

---

## Architecture

### Authentication Flow
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

### 1. Feide Application Setup
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
