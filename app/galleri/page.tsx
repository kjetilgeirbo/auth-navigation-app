import { list, getUrl } from 'aws-amplify/storage/server';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
import { runWithAmplifyServerContext } from '@/utils/amplifyServerUtils';
import GalleryWithOverlay from './components/GalleryWithOverlay';
import FeideTracking from '@/components/FeideTracking';
import styles from './page.module.css';

interface GalleryImage {
  key: string;
  url: string;
}

// Revalidate every hour to refresh pre-signed URLs
export const revalidate = 3600; // 1 hour

export default async function GalleriPage() {
  // Check authentication status server-side
  let isAuthenticated = false;
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        return await fetchAuthSession(contextSpec);
      }
    });

    if (session?.tokens?.idToken) {
      isAuthenticated = true;
    }
  } catch (error) {
    // User is not authenticated via Cognito
    isAuthenticated = false;
  }

  // Load images server-side
  let images: GalleryImage[] = [];
  try {
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        return await list(contextSpec, {
          path: 'gallery/'
        });
      }
    });

    // Get URLs for all images
    const imagePromises = result.items.map(async (item) => {
      try {
        const urlResult = await runWithAmplifyServerContext({
          nextServerContext: { cookies },
          operation: async (contextSpec) => {
            return await getUrl(contextSpec, {
              path: item.path,
              options: {
                expiresIn: 3600 // URLs valid for 1 hour
              }
            });
          }
        });

        return {
          key: item.path,
          url: urlResult.url.toString()
        };
      } catch (error) {
        console.error('Error getting URL for:', item.path, error);
        return null;
      }
    });

    const imageUrls = await Promise.all(imagePromises);
    images = imageUrls.filter((img): img is GalleryImage => img !== null);
  } catch (error) {
    console.error('Error loading images:', error);
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Bildegalleri</h1>

      {images.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>Ingen bilder enda</h2>
          <p>Galleriet er tomt. Kom tilbake senere!</p>
        </div>
      ) : (
        <>
          {/* Client component with gallery and overlay handling */}
          <GalleryWithOverlay images={images} showDemoOverlay={!isAuthenticated} />

          {/* Feide tracking for authentication */}
          {!isAuthenticated && (
            <div className={styles.feideContainer}>
              <FeideTracking />
            </div>
          )}
        </>
      )}
    </div>
  );
}