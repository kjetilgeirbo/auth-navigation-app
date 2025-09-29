'use client';

import { useEffect, useState } from 'react';
import styles from './FeideTracking.module.css';

export default function FeideTracking() {
  const [isFromFeide, setIsFromFeide] = useState(false);

  useEffect(() => {
    // Check for Feide status (both persistent and session-based)
    const fromFeide = localStorage.getItem('cameViaFeide') === 'true' ||
                     sessionStorage.getItem('feideSession') === 'true';
    setIsFromFeide(fromFeide);

    // Check if user came back from Feide (check for any Feide-related parameters)
    const urlParams = new URLSearchParams(window.location.search);
    const currentUrl = window.location.href;

    // If coming from Feide (check for various return scenarios)
    if (urlParams.get('code') ||
        urlParams.get('state') ||
        currentUrl.includes('feide') ||
        document.referrer.includes('feide') ||
        document.referrer.includes('dataporten')) {
      // Mark as came via Feide (both persistent and session-based)
      localStorage.setItem('cameViaFeide', 'true');
      sessionStorage.setItem('feideSession', Date.now().toString());
      setIsFromFeide(true);

      // Dispatch event to notify other components
      window.dispatchEvent(new Event('feideStatusChanged'));

      // Clean up URL parameters
      if (urlParams.get('code') || urlParams.get('state')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleFeideClick = () => {
    // Direct link to Feide OAuth without going through Cognito
    const feideUrl = 'https://auth.dataporten.no/oauth/authorization?' +
      'client_id=b6a97318-be39-4c55-9599-e5aa7d2f991f' +
      '&response_type=code' +
      '&scope=openid profile userid email' +
      '&redirect_uri=' + encodeURIComponent(window.location.origin + '/galleri') +
      '&state=feide_verification';

    // Navigate to Feide
    window.location.href = feideUrl;
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