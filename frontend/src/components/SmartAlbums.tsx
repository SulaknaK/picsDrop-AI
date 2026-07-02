import React from 'react';
import type { Album, Photo } from '../types';

interface SmartAlbumsProps {
  albums: Album[];
  photos: Photo[];
  onSelectAlbum: (albumId: string) => void;
}

export default function SmartAlbums({ albums, photos, onSelectAlbum }: SmartAlbumsProps) {
  if (albums.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '13px' }}>
        Albums will be created dynamically based on visual categories once analysis runs.
      </div>
    );
  }

  return (
    <div className="album-grid">
      {albums.map((a) => {
        const coverPhoto = photos.find((p) => p.id === a.cover_photo_id);
        return (
          <div
            key={a.id}
            onClick={() => onSelectAlbum(a.id)}
            className="glass-panel glass-panel-interactive"
            style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ height: '140px', width: '100%', background: '#0e1217', position: 'relative' }}>
              {coverPhoto && (
                <img
                  src={coverPhoto.url}
                  alt={a.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  fontSize: '10px',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontWeight: '600',
                }}
              >
                {a.photo_ids.length} photos
              </div>
            </div>
            <div style={{ padding: '14px' }}>
              <h4 className="font-outfit" style={{ fontSize: '15px', color: '#fff', fontWeight: '700' }}>
                {a.title}
              </h4>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px', lineHeight: '1.4' }}>
                {a.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
