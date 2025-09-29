'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FeideCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Mark that user came via Feide (both persistent and session-based)
    localStorage.setItem('cameViaFeide', 'true');
    sessionStorage.setItem('feideSession', Date.now().toString());

    // Redirect back to home with marker
    router.push('/?feide=true');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <p>Bekrefter Feide-tilgang...</p>
    </div>
  );
}