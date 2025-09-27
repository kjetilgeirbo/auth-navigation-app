'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import styles from './page.module.css';

export default function ProtectedPage() {
  const { user } = useAuthenticator((context) => [context.user]);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className={styles.container}>
        <p>Omdirigerer til innlogging...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Beskyttet Side</h1>
      <p className={styles.description}>
        Dette er en beskyttet side som kun innloggede brukere kan se.
      </p>
      <div className={styles.content}>
        <h2>Velkommen, {user.signInDetails?.loginId}!</h2>
        <p>
          Du har nå tilgang til beskyttet innhold. Denne siden er kun tilgjengelig
          for autentiserte brukere.
        </p>
        <div className={styles.userInfo}>
          <h3>Din brukerinformasjon:</h3>
          <ul>
            <li><strong>Bruker-ID:</strong> {user.userId}</li>
            <li><strong>E-post:</strong> {user.signInDetails?.loginId}</li>
            <li><strong>Innloggingsmetode:</strong> E-post og passord</li>
          </ul>
        </div>
        <div className={styles.features}>
          <h3>Funksjoner tilgjengelig for innloggede brukere:</h3>
          <ul>
            <li>Tilgang til personlig dashbord</li>
            <li>Lagre preferanser</li>
            <li>Se beskyttet innhold</li>
            <li>Administrere profil</li>
          </ul>
        </div>
      </div>
    </div>
  );
}