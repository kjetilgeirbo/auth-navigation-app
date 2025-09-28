'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import FeideLogin from '@/components/FeideLogin';
import styles from './page.module.css';

function HomePage() {
  const { user } = useAuthenticator((context) => [context.user]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Velkommen til Auth Navigation App</h1>

      {user ? (
        <div className={styles.welcomeBox}>
          <h2>Hei, {user.signInDetails?.loginId || user.username}!</h2>
          <p>Du er nå innlogget. Du kan navigere til:</p>
          <ul>
            <li>Offentlig side - tilgjengelig for alle</li>
            <li>Beskyttet side - kun for innloggede brukere</li>
          </ul>
          <p>Bruk navigasjonsmenyen øverst for å utforske sidene.</p>
        </div>
      ) : (
        <div className={styles.authContainer}>
          <h2>Logg inn eller registrer deg</h2>

          <FeideLogin />

          <p>Eller logg inn med e-post og passord:</p>
          <Authenticator
            formFields={{
              signUp: {
                email: {
                  label: 'E-post',
                  placeholder: 'Din e-postadresse',
                  isRequired: true,
                  order: 1,
                },
                password: {
                  label: 'Passord',
                  placeholder: 'Velg et passord',
                  isRequired: true,
                  order: 2,
                },
                confirm_password: {
                  label: 'Bekreft passord',
                  placeholder: 'Bekreft passordet',
                  isRequired: true,
                  order: 3,
                },
              },
              signIn: {
                username: {
                  label: 'E-post',
                  placeholder: 'Din e-postadresse',
                },
                password: {
                  label: 'Passord',
                  placeholder: 'Ditt passord',
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Authenticator.Provider>
      <HomePage />
    </Authenticator.Provider>
  );
}