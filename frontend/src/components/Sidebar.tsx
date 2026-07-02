import React from 'react';
import type { Collection } from '../types';

interface SidebarProps {
  collections: Collection[];
  activeCollectionId: string | null;
  onSelect: (id: string) => void;
}

export default function Sidebar({ collections, activeCollectionId, onSelect }: SidebarProps) {
  return (
    <section className="glass-panel sidebar-collections">
      <h3
        className="font-outfit"
        style={{
          fontSize: '14px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: '#9ca3af',
          marginBottom: '16px',
        }}
      >
        Collections
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
        {collections.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="glass-panel glass-panel-interactive"
            style={{
              padding: '12px',
              cursor: 'pointer',
              borderColor: activeCollectionId === c.id ? 'var(--primary)' : 'var(--border-color)',
              background:
                activeCollectionId === c.id ? 'rgba(99, 102, 241, 0.08)' : 'rgba(17, 24, 39, 0.4)',
            }}
          >
            <h4
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: activeCollectionId === c.id ? '#fff' : '#d1d5db',
              }}
            >
              {c.name}
            </h4>
            <p
              style={{
                fontSize: '11px',
                color: '#9ca3af',
                marginTop: '4px',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {c.description || 'No description'}
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px',
                fontSize: '10px',
              }}
            >
              <span style={{ color: '#6b7280' }}>{c.photos.length} photos</span>
              <span
                style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background:
                    c.status === 'completed'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : c.status === 'analyzing'
                      ? 'rgba(168, 85, 247, 0.15)'
                      : 'rgba(255, 255, 255, 0.05)',
                  color:
                    c.status === 'completed'
                      ? 'var(--success)'
                      : c.status === 'analyzing'
                      ? 'var(--secondary)'
                      : '#9ca3af',
                }}
              >
                {c.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
