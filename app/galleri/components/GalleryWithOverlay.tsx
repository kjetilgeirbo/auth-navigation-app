'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';

interface GalleryWithOverlayProps {
  images: Array<{
    key: string;
    url: string;
  }>;
  showDemoOverlay: boolean;
}

export default function GalleryWithOverlay({ images, showDemoOverlay }: GalleryWithOverlayProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isFromFeide, setIsFromFeide] = useState(false);

  useEffect(() => {
    // Check if user came via Feide
    const checkFeideStatus = () => {
      const fromFeide = localStorage.getItem('cameViaFeide') === 'true' ||
                       sessionStorage.getItem('feideSession') === 'true';
      setIsFromFeide(fromFeide);
    };

    checkFeideStatus();

    // Listen for Feide status changes
    const handleFeideStatusChange = () => {
      checkFeideStatus();
    };

    window.addEventListener('feideStatusChanged', handleFeideStatusChange);

    return () => {
      window.removeEventListener('feideStatusChanged', handleFeideStatusChange);
    };
  }, []);

  const openLightbox = (url: string) => {
    setLightboxImage(url);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  // Show demo overlay if not authenticated AND not from Feide
  const shouldShowOverlay = showDemoOverlay && !isFromFeide;

  return (
    <>
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
            {shouldShowOverlay && (
              <div className={styles.demoOverlay}>
                <span className={styles.demoText}>DEMOMODUS</span>
              </div>
            )}
          </div>
        ))}
      </div>

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
    </>
  );
}