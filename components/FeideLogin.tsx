'use client';

import { signInWithRedirect } from 'aws-amplify/auth';
import styles from './FeideLogin.module.css';

export default function FeideLogin() {
  const handleFeideLogin = async () => {
    try {
      await signInWithRedirect({
        provider: {
          custom: 'Feide'
        }
      });
    } catch (error) {
      console.error('Error initiating Feide login:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.divider}>
        <span>eller</span>
      </div>
      <button
        onClick={handleFeideLogin}
        className={styles.feideButton}
        type="button"
      >
        <svg className={styles.feideIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
          <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="currentColor"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>
        Logg inn med Feide
      </button>
      <p className={styles.info}>
        Bruk din institusjonelle Feide-konto for å logge inn
      </p>
    </div>
  );
}