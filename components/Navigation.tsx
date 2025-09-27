'use client';

import Link from 'next/link';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useEffect, useState } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import styles from './Navigation.module.css';

export default function Navigation() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [isFeideUser, setIsFeideUser] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    async function checkFeideUser() {
      if (user) {
        try {
          const attributes = await fetchUserAttributes();
          // Check if user logged in via Feide (custom OIDC provider)
          const identities = attributes.identities;
          if (identities) {
            const identitiesData = JSON.parse(identities);
            const feideIdentity = identitiesData?.find((id: any) => id.providerName === 'Feide');
            if (feideIdentity) {
              setIsFeideUser(true);
              setDisplayName(attributes.name || attributes.email || user.username);
            } else {
              setDisplayName(user.signInDetails?.loginId || user.username);
            }
          } else {
            setDisplayName(user.signInDetails?.loginId || user.username);
          }
        } catch (error) {
          console.error('Error fetching user attributes:', error);
          setDisplayName(user.signInDetails?.loginId || user.username);
        }
      }
    }
    checkFeideUser();
  }, [user]);

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
              <span className={styles.userInfo}>
                {isFeideUser && <span className={styles.feideLabel}>[Feide]</span>}
                Innlogget som: {displayName}
              </span>
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