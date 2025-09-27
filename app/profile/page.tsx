'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser } from 'aws-amplify/auth';

export default function ProfilePage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if user is already authenticated
        const user = await getCurrentUser();
        if (user) {
          // User is authenticated, redirect to protected page
          router.push('/protected');
        }
      } catch (error) {
        // User not authenticated, wait for OAuth callback
        console.log('Waiting for OAuth callback...');
      }
    };

    checkAuthStatus();

    // Listen for auth events
    const hubListener = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signInWithRedirect':
          setIsProcessing(false);
          router.push('/protected');
          break;
        case 'signInWithRedirect_failure':
          setError('Innlogging feilet. Vennligst prøv igjen.');
          setIsProcessing(false);
          break;
        case 'customOAuthState':
          console.log('OAuth state:', payload.data);
          break;
      }
    });

    // Cleanup
    return () => {
      hubListener();
    };
  }, [router]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem'
      }}>
        <h1>Innloggingsfeil</h1>
        <p style={{ color: '#dc3545', marginBottom: '2rem' }}>{error}</p>
        <button
          onClick={() => router.push('/')}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Tilbake til innlogging
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh'
    }}>
      <h1>Fullfører innlogging...</h1>
      <p>Vennligst vent mens vi behandler din Feide-innlogging.</p>
      <div style={{ marginTop: '2rem' }}>
        <div className="spinner" />
      </div>
      <style jsx>{`
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}