'use client';

import Link from 'next/link';
import { useAuthenticator } from '@aws-amplify/ui-react';
import styles from './Navigation.module.css';

export default function Navigation() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);

  return (
    <nav className={styles.nav}>
      <div className={styles.navContent}>
        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>
            Hjem
          </Link>
          <Link href="/public" className={styles.navLink}>
            Offentlig side
          </Link>
          {user && (
            <Link href="/protected" className={styles.navLink}>
              Beskyttet side
            </Link>
          )}
        </div>
        <div className={styles.authSection}>
          {user ? (
            <>
              <span className={styles.userInfo}>Innlogget som: {user.signInDetails?.loginId}</span>
              <button onClick={signOut} className={styles.signOutButton}>
                Logg ut
              </button>
            </>
          ) : (
            <span className={styles.signInPrompt}>Ikke innlogget</span>
          )}
        </div>
      </div>
    </nav>
  );
}