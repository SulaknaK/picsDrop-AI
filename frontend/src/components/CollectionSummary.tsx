import React from 'react';
import type { Collection } from '../types';

interface CollectionSummaryProps {
  collection: Collection;
  avgQuality: string;
}

export default function CollectionSummary({ collection, avgQuality }: CollectionSummaryProps) {
  const photoCount = collection.photos.length;
  const albumCount = collection.albums.length;
  const dupsCount = collection.duplicate_groups.length;

  return (
    <div
      className="glass-panel"
      style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
    >
      <div>
        <h2
          className="font-outfit"
          style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}
        >
          {collection.name}
        </h2>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>{collection.description}</p>
      </div>

      <div className="stats-row">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>{photoCount}</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Total Photos</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--success)' }}>{avgQuality}</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Avg Quality</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--secondary)' }}>{albumCount}</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Albums</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--warning)' }}>{dupsCount}</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Duplicates</div>
        </div>
      </div>
    </div>
  );
}
