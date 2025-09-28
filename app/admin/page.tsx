'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import styles from '../page.module.css';

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const session = await fetchAuthSession();

      if (session?.tokens?.idToken) {
        const email = session.tokens.idToken.payload.email as string;
        const groups = session.tokens.idToken.payload['cognito:groups'] as string[] | undefined;

        if (groups?.includes('admin')) {
          setIsAdmin(true);
          setUserEmail(email);
        } else {
          // User is authenticated but not an admin
          alert('Du har ikke tilgang til denne siden');
          router.push('/');
        }
      } else {
        // User is not authenticated
        alert('Du må være innlogget som administrator');
        router.push('/');
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Sjekker tilgang...</h1>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Administrasjon</h1>

      <div className={styles.welcomeBox}>
        <h2>Velkommen, Administrator!</h2>
        <p>Innlogget som: <strong>{userEmail}</strong></p>

        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
          <h3>🛡️ Admin Dashboard</h3>
          <p>Dette er en admin-only side som kun er tilgjengelig for brukere i admin-gruppen.</p>

          <h4>Registrerte administratorer:</h4>
          <ul>
            <li>geirbo@icloud.com</li>
            <li>frode@fagfilm.no</li>
          </ul>

          <h4>Admin-funksjoner (kommer):</h4>
          <ul>
            <li>Administrere innhold</li>
            <li>Se brukerstatistikk</li>
            <li>Håndtere tilganger</li>
            <li>Systeminnstillinger</li>
          </ul>
        </div>

        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
          <h4>Tilgangstyper i systemet:</h4>
          <ul>
            <li><strong>Gjest:</strong> Anonym tilgang til offentlig innhold</li>
            <li><strong>Feide-bekreftet:</strong> Gjest med Feide-markering (ingen persondata lagres)</li>
            <li><strong>E-post bruker:</strong> Autentisert via e-post (kan være vanlig bruker)</li>
            <li><strong>Administrator:</strong> E-post bruker med admin-gruppetilgang</li>
          </ul>
        </div>
      </div>
    </div>
  );
}