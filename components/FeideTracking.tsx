'use client';

import { useEffect, useState } from 'react';
import styles from './FeideTracking.module.css';

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
            Logg inn med Feide
          </button>
          <p className={styles.info}>
            🔓 Du kan bruke siden som gjest<br />
            ✅ Bekreft med Feide for å fjerne overlay
          </p>
        </>
      ) : (
        <div className={styles.confirmedBox}>
          <p className={styles.confirmedTitle}>✅ Bekreftet via Feide</p>
          <p className={styles.confirmedInfo}>
            Du har bekreftet din tilgang via Feide. Ingen personopplysninger er lagret.
          </p>
        </div>
      )}
    </div>
  );
}