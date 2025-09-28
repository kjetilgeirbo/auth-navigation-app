'use client';

import { useEffect, useState } from 'react';
import { list, getUrl } from 'aws-amplify/storage';
import styles from './page.module.css';

interface GalleryImage {
  key: string;
  url: string;
}

export default function GalleriPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const result = await list({
        path: 'gallery/',
        options: {
          accessLevel: 'guest'
        }
      });

      const imagePromises = result.items.map(async (item) => {
        try {
          const urlResult = await getUrl({
            path: item.path,
            options: {
              accessLevel: 'guest',
              validateObjectExistence: false
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
      setImages(imageUrls.filter((img): img is GalleryImage => img !== null));
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (url: string) => {
    setLightboxImage(url);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <p className={styles.loading}>Laster galleri...</p>
        </div>
      </div>
    );
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
        <div className={styles.gallery}>
          {images.map((image) => (
            <div
              key={image.key}
              className={styles.imageCard}
              onClick={() => openLightbox(image.url)}
            >
              <img
                src={image.url}
                alt={`Gallery image ${image.key}`}
                className={styles.image}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {lightboxImage && (
        <div className={styles.lightbox} onClick={closeLightbox}>
          <button className={styles.closeLightbox} onClick={closeLightbox}>
            ×
          </button>
          <img
            src={lightboxImage}
            alt="Fullscreen view"
            className={styles.lightboxImage}
          />
        </div>
      )}
    </div>
  );
}