'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Page() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Velkommen!</h1>

      <div className={styles.welcomeBox}>
        <h2>Du har full tilgang som gjest</h2>
        <p>Alle kan bruke denne siden - du trenger ikke logge inn!</p>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button
            onClick={() => router.push('/auth')}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Bli bruker
          </button>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
          <p>Registrer deg for å få tilgang til ekstra funksjoner</p>
        </div>
      </div>
    </div>
  );
}