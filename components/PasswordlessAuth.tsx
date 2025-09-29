'use client';

import { useState, useEffect } from 'react';
import { signUp, signIn, signOut, fetchAuthSession, confirmSignIn } from 'aws-amplify/auth';
import styles from './PasswordlessAuth.module.css';

export default function PasswordlessAuth() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

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

        // Dispatch event for navigation update
        window.dispatchEvent(new Event('authStatusChanged'));
      } else {
        // No valid session
        setIsSignedIn(false);
        setIsAdmin(false);
        setUserEmail('');
      }
    } catch (error) {
      console.error('Auth status check error:', error);
      // User is not signed in or session error
      setIsSignedIn(false);
      setIsAdmin(false);
      setUserEmail('');
    }
  };

  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@')) {
      setMessage('Vennligst skriv inn en gyldig e-postadresse');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Try to sign in using custom auth flow
      try {
        const signInResult = await signIn({
          username: email,
          options: {
            authFlowType: 'CUSTOM_WITHOUT_SRP',
          },
        });

        // Handle custom challenge
        if (signInResult.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE') {
          setCurrentChallenge(signInResult);
          setShowVerification(true);
          setMessage('Vi har sendt en innloggingskode til din e-post');
        }
      } catch (signInError: any) {
        // With CUSTOM_WITHOUT_SRP, we get NotAuthorizedException for non-existent users
        if (signInError.name === 'UserNotFoundException' ||
            signInError.name === 'NotAuthorizedException' ||
            signInError.message?.includes('does not exist') ||
            signInError.message?.includes('Incorrect username or password')) {
          // User doesn't exist, create new account
          try {
            // Generate a dummy password (will not be used due to pre-sign-up trigger)
            const dummyPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

            const { nextStep } = await signUp({
              username: email,
              password: dummyPassword,
              options: {
                userAttributes: {
                  email: email,
                },
              },
            });

            // After sign-up, immediately sign in with custom auth flow
            const signInResult = await signIn({
              username: email,
              options: {
                authFlowType: 'CUSTOM_WITHOUT_SRP',
              },
            });

            if (signInResult.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE') {
              setCurrentChallenge(signInResult);
              setShowVerification(true);
              setMessage('Velkommen! Vi har sendt en verifiseringskode til din e-post');
            }
          } catch (signUpError: any) {
            console.error('Sign up error:', signUpError);
            setMessage('Feil: ' + (signUpError.message || 'Kunne ikke opprette konto'));
          }
        } else {
          throw signInError;
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setMessage('Feil: ' + (error.message || 'Kunne ikke sende verifiseringskode'));
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (!code || code.length !== 6) {
      setMessage('Vennligst skriv inn 6-sifret kode');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Confirm the custom challenge with the code
      const result = await confirmSignIn({
        challengeResponse: code,
      });

      if (result.isSignedIn) {
        setShowVerification(false);
        setMessage('Velkommen! Du er nå innlogget.');
        setCode('');
        setEmail('');

        // Use retry logic to wait for session to be available
        const waitForSession = async (retries = 3) => {
          for (let i = 0; i < retries; i++) {
            try {
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Wait longer each time

              const session = await fetchAuthSession();
              if (session?.tokens?.idToken) {
                await checkAuthStatus();

                // Check if user is admin for redirect
                const groups = session.tokens.idToken.payload['cognito:groups'] as string[] | undefined;
                const isAdminUser = groups?.includes('admin') || false;

                // Redirect to appropriate page
                window.location.href = isAdminUser ? '/admin/galleri' : '/galleri';
                return;
              }
            } catch (error) {
              console.error(`Session check attempt ${i + 1} failed:`, error);
              if (i === retries - 1) {
                // Last attempt failed, fallback to galleri
                console.log('All session attempts failed, redirecting to galleri');
                window.location.href = '/galleri';
              }
            }
          }
        };

        waitForSession();
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setMessage('Feil: ' + (error.message || 'Ugyldig kode'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsSignedIn(false);
      setIsAdmin(false);
      setUserEmail('');
      setMessage('Logget ut');
      // Dispatch event for navigation update
      window.dispatchEvent(new Event('authStatusChanged'));
    } catch (error: any) {
      setMessage('Feil ved utlogging: ' + error.message);
    }
  };

  if (isSignedIn) {
    return (
      <div className={styles.container}>
        <div className={styles.welcomeBox}>
          <h2 className={styles.welcomeTitle}>Velkommen!</h2>
          <p className={styles.welcomeEmail}>📧 {userEmail}</p>
          {isAdmin && (
            <p className={styles.adminBadge}>
              🛡️ Administratortilgang
            </p>
          )}
          <button
            onClick={handleSignOut}
            className={styles.signOutButton}
          >
            Logg ut
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {!showVerification ? (
        <>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">
              E-postadresse
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="navn@domene.no"
              onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
              className={styles.input}
              disabled={loading}
            />
          </div>
          <button
            onClick={handleEmailSubmit}
            disabled={!email || loading}
            className={styles.button}
          >
            {loading ? 'Sender...' : 'Send innloggingskode'}
          </button>
          {message && (
            <div className={`${styles.message} ${message.startsWith('Feil') ? styles.messageError : styles.messageSuccess}`}>
              {message}
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className={styles.verificationTitle}>
            Verifiser e-post
          </h2>
          <p className={styles.verificationInfo}>
            Vi har sendt en kode til <span className={styles.verificationEmail}>{email}</span>
          </p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            onKeyPress={(e) => e.key === 'Enter' && handleCodeSubmit()}
            className={styles.codeInput}
            disabled={loading}
          />
          <button
            onClick={handleCodeSubmit}
            disabled={!code || code.length !== 6 || loading}
            className={styles.button}
          >
            {loading ? 'Verifiserer...' : 'Bekreft kode'}
          </button>
          <button
            onClick={() => {
              setShowVerification(false);
              setCode('');
              setMessage('');
            }}
            className={styles.backButton}
          >
            Tilbake
          </button>
          {message && (
            <div className={`${styles.message} ${message.startsWith('Feil') ? styles.messageError : styles.messageSuccess}`}>
              {message}
            </div>
          )}
        </>
      )}
    </div>
  );
}