import styles from './page.module.css';

export default function PublicPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Offentlig Side</h1>
      <p className={styles.description}>
        Dette er en offentlig side som alle besøkende kan se, uavhengig av om de er innlogget eller ikke.
      </p>
      <div className={styles.content}>
        <h2>Velkommen!</h2>
        <p>
          Denne siden demonstrerer innhold som er tilgjengelig for alle brukere.
          Du trenger ikke være autentisert for å se dette innholdet.
        </p>
        <ul className={styles.features}>
          <li>Åpen for alle besøkende</li>
          <li>Ingen autentisering påkrevd</li>
          <li>Offentlig tilgjengelig informasjon</li>
        </ul>
      </div>
    </div>
  );
}