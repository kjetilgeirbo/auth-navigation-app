'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import FeideTracking from '@/components/FeideTracking';
import PasswordlessAuth from '@/components/PasswordlessAuth';
import styles from './page.module.css';
import { fetchAuthSession } from 'aws-amplify/auth';

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const session = await fetchAuthSession();
        if (session?.tokens?.idToken) {
          // User is authenticated, dispatch event for navigation update
          window.dispatchEvent(new Event('authStatusChanged'));

          // Check if admin and redirect appropriately
          const groups = session.tokens.idToken.payload['cognito:groups'] as string[] | undefined;
          const isAdmin = groups?.includes('admin') || false;

          // Redirect to appropriate gallery
          router.push(isAdmin ? '/admin/galleri' : '/galleri');
        }
      } catch (error) {
        // Not authenticated
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Logg inn for å se galleriet</h1>

      <div className={styles.authBox}>
        {/* Passwordless email authentication */}
        <PasswordlessAuth />

        {/* Divider */}
        <div className={styles.divider}>
          <span>eller</span>
        </div>

        {/* Feide login option */}
        <FeideTracking />
      </div>
    </div>
  );
}