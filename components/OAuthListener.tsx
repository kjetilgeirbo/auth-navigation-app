'use client';

import { useEffect } from 'react';
import { Hub } from 'aws-amplify/utils';
import { useRouter } from 'next/navigation';

export default function OAuthListener() {
  const router = useRouter();

  useEffect(() => {
    // Amplify handles OAuth callbacks automatically
    // We just need to listen for the auth events

    // Listen for auth events
    const hubListener = Hub.listen('auth', ({ payload }) => {
      console.log('Auth event:', payload.event);

      switch (payload.event) {
        case 'signInWithRedirect':
          console.log('OAuth sign-in successful');
          window.dispatchEvent(new Event('authStatusChanged'));
          router.push('/profile');
          break;

        case 'signInWithRedirect_failure':
          console.error('OAuth sign-in failed:', payload.data);
          break;

        case 'signedIn':
          console.log('User signed in');
          window.dispatchEvent(new Event('authStatusChanged'));
          break;

        case 'signedOut':
          console.log('User signed out');
          window.dispatchEvent(new Event('authStatusChanged'));
          break;
      }
    });

    return () => {
      hubListener();
    };
  }, [router]);

  return null;
}