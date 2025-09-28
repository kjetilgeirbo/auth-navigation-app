'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import FeideTracking from '@/components/FeideTracking';
import styles from '../page.module.css';
import { fetchAuthSession } from 'aws-amplify/auth';

// Separate component to handle authenticated state with proper hooks
function AuthenticatedContent({ user, signOut, router }: any) {
  useEffect(() => {
    if (user) {
      // Dispatch event to update navigation
      window.dispatchEvent(new Event('authStatusChanged'));
      // Give navigation time to update, then redirect
      setTimeout(() => {
        router.push('/');
      }, 100);
    }
  }, [user, router]);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Velkommen, {user?.signInDetails?.loginId || 'bruker'}!</h2>
      <p>Du er nå innlogget. Videresender...</p>

      {/* Check if user is admin */}
      {user && (
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Gå til forsiden
          </button>
          <button
            onClick={signOut}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Logg ut
          </button>
        </div>
      )}
    </div>
  );
}

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
        }
      } catch (error) {
        // Not authenticated
      }
    };

    checkAuth();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Bli bruker eller logg inn</h1>

      <div className={styles.welcomeBox}>
        <Authenticator
          signUpAttributes={['email']}
          loginMechanisms={['email']}
          variation="default"
          components={{
            SignIn: {
              Header() {
                return (
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2>Logg inn</h2>
                    <p>Bruk din e-postadresse for å logge inn</p>
                  </div>
                );
              },
            },
            SignUp: {
              Header() {
                return (
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2>Opprett konto</h2>
                    <p>Registrer deg med din e-postadresse</p>
                  </div>
                );
              },
              FormFields() {
                return (
                  <>
                    {/* Using default form fields */}
                    <Authenticator.SignUp.FormFields />

                    {/* Custom fields can be added here if needed */}
                  </>
                );
              },
            },
          }}
        >
          {({ signOut, user }) => {
            return <AuthenticatedContent user={user} signOut={signOut} router={router} />;
          }}
        </Authenticator>

        {/* Feide login option below */}
        <div style={{
          marginTop: '30px',
          paddingTop: '30px',
          borderTop: '1px solid #e0e0e0',
          textAlign: 'center',
        }}>
          <h3>Eller bruk Feide</h3>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Bekreft din tilhørighet via Feide (ingen persondata lagres)
          </p>
          <FeideTracking />
        </div>
      </div>
    </div>
  );
}