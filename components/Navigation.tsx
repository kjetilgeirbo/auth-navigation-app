'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchAuthSession, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import styles from './Navigation.module.css';

export default function Navigation() {
  const pathname = usePathname();
  const [isFromFeide, setIsFromFeide] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Check if a link is active based on current pathname
  const isActiveLink = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  const checkAuthStatus = async () => {
    try {
      const session = await fetchAuthSession();
      if (session?.tokens?.idToken) {
        setIsSignedIn(true);
        const email = session.tokens.idToken.payload.email as string;
        setUserEmail(email);

        // Check if user is in admin group
        const groups = session.tokens.idToken.payload['cognito:groups'] as string[] | undefined;
        setIsAdmin(groups?.includes('admin') || false);
      } else {
        setIsSignedIn(false);
        setIsAdmin(false);
        setUserEmail('');
      }
    } catch (error) {
      // User is not signed in
      setIsSignedIn(false);
      setIsAdmin(false);
      setUserEmail('');
    }
  };

  const handleLogout = async () => {
    if (isSignedIn) {
      // Sign out from Cognito
      await signOut();
      setIsSignedIn(false);
      setIsAdmin(false);
      setUserEmail('');
    }

    // Clear Feide session markers (both localStorage and sessionStorage)
    localStorage.removeItem('cameViaFeide');
    sessionStorage.removeItem('feideSession');

    // Dispatch events to update all components
    window.dispatchEvent(new Event('feideStatusChanged'));
    window.dispatchEvent(new Event('authStatusChanged'));

    // Reload page to reset state
    window.location.href = '/';
  };

  const handleLogin = () => {
    // Navigate to auth page
    window.location.href = '/auth';
  };

  const getUserStatus = () => {
    if (isSignedIn && isAdmin) {
      return `🛡️ Admin: ${userEmail}`;
    }
    if (isSignedIn) {
      return `📧 ${userEmail}`;
    }
    if (isFromFeide) {
      return '✓ Feide-bekreftet';
    }
    return 'Gjest';
  };

  const getStatusColor = () => {
    if (isSignedIn && isAdmin) return '#d32f2f'; // Red for admin
    if (isSignedIn) return '#2196f3'; // Blue for email user
    if (isFromFeide) return '#4caf50'; // Green for Feide
    return '#666'; // Gray for guest
  };

  useEffect(() => {
    // Check initial auth status
    checkAuthStatus();

    // Check Feide status
    const checkFeideStatus = () => {
      const fromFeide = localStorage.getItem('cameViaFeide') === 'true' ||
                       sessionStorage.getItem('feideSession') === 'true';
      setIsFromFeide(fromFeide);
    };

    checkFeideStatus();

    // Listen for Amplify Auth events using Hub
    const hubListener = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
        case 'signedOut':
        case 'tokenRefresh':
        case 'tokenRefresh_failure':
          // Re-check auth status when any auth event occurs
          checkAuthStatus();
          break;
      }
    });

    // Listen for custom auth events (from auth page)
    const handleAuthStatusChange = () => {
      checkAuthStatus();
    };

    // Listen for Feide status changes
    const handleFeideStatusChange = () => {
      checkFeideStatus();
    };

    window.addEventListener('authStatusChanged', handleAuthStatusChange);
    window.addEventListener('feideStatusChanged', handleFeideStatusChange);

    // Cleanup
    return () => {
      hubListener();
      window.removeEventListener('authStatusChanged', handleAuthStatusChange);
      window.removeEventListener('feideStatusChanged', handleFeideStatusChange);
    };
  }, []);

  return (
    <nav className={styles.nav}>
      <div className={styles.navContent}>
        <div className={styles.navLinks}>
          <Link
            href="/"
            className={`${styles.navLink} ${isActiveLink('/') ? styles.navLinkActive : ''}`}
          >
            Hjem
          </Link>
          <Link
            href="/public"
            className={`${styles.navLink} ${isActiveLink('/public') ? styles.navLinkActive : ''}`}
          >
            Offentlig side
          </Link>
          <Link
            href="/galleri"
            className={`${styles.navLink} ${isActiveLink('/galleri') ? styles.navLinkActive : ''}`}
          >
            Galleri
          </Link>
          {isAdmin && (
            <>
              <Link
                href="/admin"
                className={`${styles.navLink} ${isActiveLink('/admin') ? styles.navLinkActive : ''}`}
                style={{ color: '#d32f2f', fontWeight: 'bold' }}
              >
                Admin
              </Link>
              <Link
                href="/admin/galleri"
                className={`${styles.navLink} ${isActiveLink('/admin/galleri') ? styles.navLinkActive : ''}`}
                style={{ color: '#d32f2f', fontWeight: 'bold' }}
              >
                Admin Galleri
              </Link>
            </>
          )}
        </div>
        <div className={styles.authSection}>
          <span className={styles.userInfo} style={{ color: getStatusColor() }}>
            {getUserStatus()}
          </span>
          {(isFromFeide || isSignedIn) ? (
            <button onClick={handleLogout} className={styles.signOutButton}>
              Logg ut
            </button>
          ) : (
            <button onClick={handleLogin} className={styles.signOutButton}>
              Logg inn
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}