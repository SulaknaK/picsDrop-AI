import React from 'react';
import type { Photo } from '../types';

interface PhotoModalProps {
  photo: Photo;
  onClose: () => void;
}

export default function PhotoModal({ photo, onClose }: PhotoModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{ width: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '100%',
            maxHeight: '300px',
            background: '#0e1217',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <img
            src={photo.url}
            alt={photo.name}
            style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
          />
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 className="font-outfit" style={{ fontSize: '18px', color: '#fff' }}>
                {photo.name.split('/').pop()}
              </h3>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                Type: {photo.type} | Added: {new Date(photo.registered_at).toLocaleDateString()}
              </span>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '16px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {photo.status === 'analyzed' ? (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Caption */}
              <div>
                <h4
                  style={{
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    color: '#9ca3af',
                    letterSpacing: '0.5px',
                  }}
                >
                  Generated Caption
                </h4>
                <p style={{ fontSize: '13px', color: '#fff', marginTop: '4px', fontStyle: 'italic' }}>
                  "{photo.caption}"
                </p>
              </div>

              {/* Quality breakdown */}
              <div>
                <h4
                  style={{
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    color: '#9ca3af',
                    letterSpacing: '0.5px',
                    marginBottom: '6px',
                  }}
                >
                  Quality breakdown (Score: {photo.quality_score})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                  {(
                    [
                      { label: 'Sharpness', value: photo.quality_details.sharpness, color: 'var(--primary)' },
                      { label: 'Composition', value: photo.quality_details.composition, color: 'var(--accent)' },
                      { label: 'Lighting', value: photo.quality_details.lighting, color: 'var(--secondary)' },
                    ] as { label: string; value: number; color: string }[]
                  ).map(({ label, value, color }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{label}:</span>
                        <span>{(value * 100).toFixed(0)}%</span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '4px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                          marginTop: '2px',
                        }}
                      >
                        <div
                          style={{ width: `${value * 100}%`, height: '100%', background: color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {photo.quality_details.issues.length > 0 && (
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '11px',
                      color: 'var(--danger)',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      background: 'rgba(239, 68, 68, 0.08)',
                    }}
                  >
                    <strong>Detected Issues:</strong> {photo.quality_details.issues.join(', ')}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <h4
                  style={{
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    color: '#9ca3af',
                    letterSpacing: '0.5px',
                    marginBottom: '6px',
                  }}
                >
                  Semantic Tags
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {photo.tags.map((t, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '10px',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#ccc',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '20px',
                        padding: '2px 8px',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '20px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
              Photo has not been analyzed yet. Click "🔮 Run AI Analysis" in the workspace to scan
              quality and extract semantic index.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
