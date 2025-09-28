'use client';

import { useState, useEffect } from 'react';
import { signUp, confirmSignUp, signIn, signOut, fetchAuthSession, autoSignIn } from 'aws-amplify/auth';
import styles from './FeideLogin.module.css';

export default function EmailAuth() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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
      }
    } catch (error) {
      // User is not signed in
      setIsSignedIn(false);
      setIsAdmin(false);
    }
  };

  const generatePassword = () => {
    // Generate a secure password that meets Cognito requirements
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 20; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + 'Aa1!'; // Ensure it meets all requirements
  };

  const handleEmailSubmit = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Generate a random password - users will never need to know it
      const tempPassword = generatePassword();

      // Store password temporarily for auto sign-in
      sessionStorage.setItem('tempPwd', tempPassword);
      sessionStorage.setItem('tempEmail', email);

      // Try to sign up the user
      const { nextStep } = await signUp({
        username: email,
        password: tempPassword,
        options: {
          userAttributes: {
            email: email,
          },
          autoSignIn: true, // Enable auto sign-in after confirmation
        },
      });

      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setShowVerification(true);
        setMessage('Sjekk e-posten din for verifiseringskoden');
      }
    } catch (error: any) {
      if (error.name === 'UsernameExistsException') {
        // User already exists, try to sign in
        try {
          // Try with stored password first
          const storedPwd = sessionStorage.getItem('tempPwd');
          const storedEmail = sessionStorage.getItem('tempEmail');

          if (storedEmail === email && storedPwd) {
            const result = await signIn({
              username: email,
              password: storedPwd,
            });

            if (result.isSignedIn) {
              await checkAuthStatus();
              setMessage('Innlogget!');
            }
          } else {
            // User exists but we don't have their password
            // For passwordless, we'd need to implement a custom auth flow
            // For now, we'll just show an error
            setMessage('Denne e-posten er allerede registrert. Prøv en annen e-post.');
          }
        } catch (signInError) {
          setMessage('Kunne ikke logge inn. Prøv på nytt.');
        }
      } else {
        setMessage('Feil: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { nextStep } = await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      if (nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
        // Auto sign-in is enabled, complete it
        const signInResult = await autoSignIn();
        if (signInResult.isSignedIn) {
          await checkAuthStatus();
          setShowVerification(false);
          setMessage('Registrering fullført og innlogget!');
          setCode('');
          setEmail('');
        }
      } else if (nextStep.signUpStep === 'DONE') {
        // Manual sign in required
        const tempPassword = sessionStorage.getItem('tempPwd');
        if (tempPassword) {
          const result = await signIn({
            username: email,
            password: tempPassword,
          });
          if (result.isSignedIn) {
            await checkAuthStatus();
            setShowVerification(false);
            setMessage('Registrering fullført og innlogget!');
            setCode('');
            setEmail('');
          }
        }
      }
    } catch (error: any) {
      setMessage('Feil ved verifisering: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      sessionStorage.removeItem('tempPwd');
      sessionStorage.removeItem('tempEmail');
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
        <div style={{ padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
          <p>✅ <strong>Innlogget som:</strong> {userEmail}</p>
          {isAdmin && (
            <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>
              🛡️ Administrator
            </p>
          )}
          <button
            onClick={handleSignOut}
            className={styles.feideButton}
            style={{ marginTop: '10px', backgroundColor: '#f44336' }}
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
          <h3>E-post innlogging</h3>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Din e-postadresse"
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
            disabled={loading}
          />
          <button
            onClick={handleEmailSubmit}
            disabled={!email || loading}
            className={styles.feideButton}
            style={{ width: '100%' }}
          >
            {loading ? 'Sender...' : 'Send verifiseringskode'}
          </button>
          {message && (
            <p style={{ marginTop: '10px', color: message.startsWith('Feil') ? '#d32f2f' : '#4caf50' }}>
              {message}
            </p>
          )}
        </>
      ) : (
        <>
          <h3>Skriv inn verifiseringskode</h3>
          <p>En verifiseringskode er sendt til {email}</p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-sifret kode"
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
            disabled={loading}
          />
          <button
            onClick={handleCodeSubmit}
            disabled={!code || loading}
            className={styles.feideButton}
            style={{ width: '100%', marginBottom: '10px' }}
          >
            {loading ? 'Verifiserer...' : 'Verifiser'}
          </button>
          <button
            onClick={() => {
              setShowVerification(false);
              setCode('');
              setMessage('');
            }}
            className={styles.feideButton}
            style={{ width: '100%', backgroundColor: '#666' }}
          >
            Tilbake
          </button>
          {message && (
            <p style={{ marginTop: '10px', color: message.startsWith('Feil') ? '#d32f2f' : '#4caf50' }}>
              {message}
            </p>
          )}
        </>
      )}
    </div>
  );
}