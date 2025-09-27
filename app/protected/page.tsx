'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import styles from './page.module.css';

export default function ProtectedPage() {
  const { user } = useAuthenticator((context) => [context.user]);
  const router = useRouter();
  const [userAttributes, setUserAttributes] = useState<any>({});
  const [isFeideUser, setIsFeideUser] = useState(false);
  const [feideInfo, setFeideInfo] = useState<any>({});

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    async function loadUserInfo() {
      if (user) {
        try {
          const attributes = await fetchUserAttributes();
          setUserAttributes(attributes);

          // Check if user is from Feide
          if (attributes.identities) {
            const identitiesData = JSON.parse(attributes.identities);
            const feideIdentity = identitiesData?.find((id: any) => id.providerName === 'Feide');

            if (feideIdentity) {
              setIsFeideUser(true);
              setFeideInfo({
                userId: feideIdentity.userId,
                dateCreated: feideIdentity.dateCreated,
                providerName: feideIdentity.providerName,
              });
            }
          }
        } catch (error) {
          console.error('Error fetching user attributes:', error);
        }
      }
    }
    loadUserInfo();
  }, [user]);

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
        <h2>Velkommen, {userAttributes.name || userAttributes.email || user.signInDetails?.loginId || user.username}!</h2>
        <p>
          Du har nå tilgang til beskyttet innhold. Denne siden er kun tilgjengelig
          for autentiserte brukere.
        </p>
        <div className={styles.userInfo}>
          <h3>Din brukerinformasjon:</h3>
          <ul>
            <li><strong>Bruker-ID:</strong> {user.userId}</li>
            <li><strong>Brukernavn:</strong> {user.username}</li>
            {userAttributes.email && (
              <li><strong>E-post:</strong> {userAttributes.email}</li>
            )}
            {userAttributes.name && (
              <li><strong>Navn:</strong> {userAttributes.name}</li>
            )}
            <li><strong>Innloggingsmetode:</strong> {isFeideUser ? 'Feide (OpenID Connect)' : 'E-post og passord'}</li>
          </ul>
        </div>

        {isFeideUser && (
          <div className={styles.feideInfo}>
            <h3>Feide-informasjon:</h3>
            <ul>
              <li><strong>Provider:</strong> {feideInfo.providerName}</li>
              <li><strong>Feide ID:</strong> {feideInfo.userId}</li>
              <li><strong>Konto opprettet:</strong> {new Date(feideInfo.dateCreated).toLocaleDateString('nb-NO')}</li>
              {userAttributes['custom:feide_org'] && (
                <li><strong>Organisasjon:</strong> {userAttributes['custom:feide_org']}</li>
              )}
            </ul>
          </div>
        )}

        <div className={styles.features}>
          <h3>Funksjoner tilgjengelig for innloggede brukere:</h3>
          <ul>
            <li>Tilgang til personlig dashbord</li>
            <li>Lagre preferanser</li>
            <li>Se beskyttet innhold</li>
            <li>Administrere profil</li>
            {isFeideUser && <li>Tilgang til institusjonelle ressurser</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}