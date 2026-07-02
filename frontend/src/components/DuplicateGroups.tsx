import React from 'react';
import type { Photo } from '../types';

interface DuplicateGroupsProps {
  duplicateGroups: string[][];
  photos: Photo[];
}

export default function DuplicateGroups({ duplicateGroups, photos }: DuplicateGroupsProps) {
  if (duplicateGroups.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '13px' }}>
        No duplicate groupings found. Visual indexing groups highly similar photos side-by-side.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {duplicateGroups.map((group, idx) => {
        const groupScores = group.map(
          (gId) => photos.find((x) => x.id === gId)?.quality_score ?? 0
        );
        const maxScore = Math.max(...groupScores);

        return (
          <div key={idx} className="glass-panel" style={{ padding: '16px' }}>
            <h4
              className="font-outfit"
              style={{ fontSize: '13px', color: 'var(--warning)', marginBottom: '12px', fontWeight: '700' }}
            >
              Duplicate Group #{idx + 1}
            </h4>
            <div className="duplicate-cards-row">
              {group.map((pid) => {
                const p = photos.find((x) => x.id === pid);
                if (!p) return null;
                const isBest = p.quality_score === maxScore && p.quality_score > 0;
                return (
                  <div
                    key={pid}
                    className="glass-panel"
                    style={{
                      width: '150px',
                      overflow: 'hidden',
                      border: isBest
                        ? '1.5px solid var(--success)'
                        : '1px solid var(--border-color)',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={p.url}
                      alt={p.name}
                      style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                    />
                    <div style={{ padding: '6px', fontSize: '10px' }}>
                      <div
                        style={{
                          fontWeight: '600',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          color: '#fff',
                        }}
                      >
                        {p.name.split('/').pop()}
                      </div>
                      <div style={{ color: '#9ca3af', marginTop: '2px' }}>Score: {p.quality_score}</div>
                    </div>
                    {isBest && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '4px',
                          left: '4px',
                          fontSize: '8px',
                          background: 'var(--success)',
                          color: '#fff',
                          padding: '2px 4px',
                          borderRadius: '3px',
                          fontWeight: '700',
                        }}
                      >
                        👍 KEEP BEST
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
