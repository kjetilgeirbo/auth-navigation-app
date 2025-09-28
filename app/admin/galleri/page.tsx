'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { list, getUrl, uploadData, remove } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import styles from '../../galleri/page.module.css';

interface GalleryImage {
  key: string;
  url: string;
}

export default function AdminGalleriPage() {
  const router = useRouter();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoadImages();
  }, []);

  const checkAdminAndLoadImages = async () => {
    try {
      const session = await fetchAuthSession();
      if (session?.tokens?.idToken) {
        const groups = session.tokens.idToken.payload['cognito:groups'] as string[] | undefined;
        if (groups?.includes('admin')) {
          setIsAdmin(true);
          await loadImages();
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/');
    }
  };

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        const fileName = `${Date.now()}-${file.name}`;
        const path = `gallery/${fileName}`;

        await uploadData({
          path,
          data: file,
          options: {
            contentType: file.type,
            accessLevel: 'guest'
          }
        }).result;

        return path;
      });

      await Promise.all(uploadPromises);
      setSelectedFiles(null);

      // Reset file input
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Reload images
      await loadImages();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Feil ved opplasting av filer');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Er du sikker på at du vil slette dette bildet?')) return;

    try {
      await remove({
        path: key,
        options: {
          accessLevel: 'guest'
        }
      });

      // Update local state
      setImages(images.filter(img => img.key !== key));
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Feil ved sletting av bilde');
    }
  };

  const openLightbox = (url: string) => {
    setLightboxImage(url);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <p>Laster...</p>
      </div>
    );
  }

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
      <h1 className={styles.title}>Admin - Bildegalleri</h1>

      {/* Upload Section */}
      <div className={styles.uploadSection}>
        <h2 className={styles.uploadTitle}>Last opp nye bilder</h2>
        <div className={styles.uploadForm}>
          <label htmlFor="fileInput" className={styles.fileInputLabel}>
            Velg bilder
          </label>
          <input
            id="fileInput"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className={styles.fileInput}
          />
          {selectedFiles && (
            <span className={styles.selectedFiles}>
              {selectedFiles.length} fil(er) valgt
            </span>
          )}
          <button
            onClick={handleUpload}
            disabled={!selectedFiles || uploading}
            className={styles.uploadButton}
          >
            {uploading ? 'Laster opp...' : 'Last opp'}
          </button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>Ingen bilder enda</h2>
          <p>Last opp ditt første bilde ovenfor!</p>
        </div>
      ) : (
        <div className={styles.gallery}>
          {images.map((image) => (
            <div
              key={image.key}
              className={styles.imageCard}
            >
              <img
                src={image.url}
                alt={`Gallery image ${image.key}`}
                className={styles.image}
                loading="lazy"
                onClick={() => openLightbox(image.url)}
              />
              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(image.key);
                }}
                title="Slett bilde"
              >
                ×
              </button>
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