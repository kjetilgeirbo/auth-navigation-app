'use client';

import { useEffect, useState } from 'react';
import styles from './FeideLogin.module.css';

export default function FeideTracking() {
  const [isFromFeide, setIsFromFeide] = useState(false);

  // Feide OAuth URL - uten scopes siden vi ikke trenger data
  const FEIDE_AUTH_URL = 'https://auth.dataporten.no/oauth/authorization';
  const CLIENT_ID = 'b6a97318-be39-4c55-9599-e5aa7d2f991f';

  useEffect(() => {
    // Check localStorage for Feide status
    setIsFromFeide(localStorage.getItem('cameViaFeide') === 'true');

    // Check if user came back from Feide (via state parameter)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('state') === 'feide-verify' && urlParams.get('code')) {
      // Set a marker that user came via Feide
      localStorage.setItem('cameViaFeide', 'true');
      sessionStorage.setItem('feideSession', Date.now().toString());
      setIsFromFeide(true);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleFeideClick = () => {
    // Use existing redirect URI that's already configured in Feide
    const REDIRECT_URI = typeof window !== 'undefined'
      ? window.location.origin + '/'
      : 'http://localhost:3000/';

    // Build Feide authorization URL without requesting any scopes
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      state: 'feide-verify', // Mark this as Feide verification
      // No scopes - we just want to know they authenticated with Feide
    });

    // Redirect to Feide
    window.location.href = `${FEIDE_AUTH_URL}?${params.toString()}`;
  };

  return (
    <div className={styles.container}>
      {!isFromFeide ? (
        <>
          <button
            onClick={handleFeideClick}
            className={styles.feideButton}
            type="button"
          >
            <svg className={styles.feideIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
              <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="currentColor"/>
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
            </svg>
            Bekreft med Feide (valgfritt)
          </button>
          <p className={styles.info}>
            🔓 Du kan bruke siden som gjest<br />
            ✅ Bekreft med Feide for å fjerne overlay
          </p>
        </>
      ) : (
        <div style={{ padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
          <p>✅ <strong>Bekreftet via Feide</strong></p>
          <p style={{ fontSize: '14px', marginTop: '5px' }}>
            Du har bekreftet din tilgang via Feide. Ingen personopplysninger er lagret.
          </p>
        </div>
      )}
    </div>
  );
}