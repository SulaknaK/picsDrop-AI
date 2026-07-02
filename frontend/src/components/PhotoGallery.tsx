import React from 'react';
import type { Photo, Album } from '../types';

interface PhotoGalleryProps {
  photos: Photo[];
  albums: Album[];
  selectedAlbumId: string | null;
  onClearAlbumFilter: () => void;
  onSelectPhoto: (photo: Photo) => void;
}

export default function PhotoGallery({
  photos,
  albums,
  selectedAlbumId,
  onClearAlbumFilter,
  onSelectPhoto,
}: PhotoGalleryProps) {
  return (
    <div>
      {selectedAlbumId && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px',
          }}
        >
          <span>
            Showing album:{' '}
            <strong>{albums.find((a) => a.id === selectedAlbumId)?.title}</strong>
          </span>
          <button
            onClick={onClearAlbumFilter}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--danger)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '600',
            }}
          >
            Clear Filter
          </button>
        </div>
      )}

      <div className="photo-grid">
        {photos.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelectPhoto(p)}
            className="glass-panel glass-panel-interactive"
            style={{ overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
          >
            <div style={{ width: '100%', height: '120px', position: 'relative', background: '#0e1217' }}>
              <img src={p.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

              {p.status === 'analyzed' ? (
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background:
                      p.quality_score >= 0.8
                        ? 'rgba(16, 185, 129, 0.9)'
                        : p.quality_score >= 0.5
                        ? 'rgba(245, 158, 11, 0.9)'
                        : 'rgba(239, 68, 68, 0.9)',
                    color: '#fff',
                  }}
                >
                  Q: {p.quality_score}
                </span>
              ) : (
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    fontSize: '9px',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#aaa',
                    padding: '2px 5px',
                    borderRadius: '4px',
                  }}
                >
                  {p.status}
                </span>
              )}
            </div>
            <div style={{ padding: '8px' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  color: '#fff',
                }}
              >
                {p.name.split('/').pop()}
              </div>
              {p.caption && (
                <p
                  style={{
                    fontSize: '10px',
                    color: '#9ca3af',
                    marginTop: '4px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.caption}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
