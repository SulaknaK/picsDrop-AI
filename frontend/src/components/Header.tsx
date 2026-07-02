import React from 'react';

interface HeaderProps {
  backendOnline: boolean | null;
  onCreateCollection: () => void;
}

export default function Header({ backendOnline, onCreateCollection }: HeaderProps) {
  return (
    <header className="glass-panel app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '28px' }}>📸</span>
        <div>
          <h1
            className="font-outfit"
            style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff' }}
          >
            PicsDrop <span className="text-gradient-primary">AI</span>
          </h1>
          <p style={{ fontSize: '11px', color: '#9ca3af' }}>AI Event Memory Orchestrator</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: '30px',
            background: 'rgba(255,255,255,0.05)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: backendOnline ? 'var(--success)' : 'var(--warning)',
              display: 'inline-block',
            }}
          />
          <span>{backendOnline ? 'API Connected' : 'Browser Sandbox'}</span>
        </div>
        <button
          onClick={onCreateCollection}
          className="glass-panel"
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          + Create Collection
        </button>
      </div>
    </header>
  );
}
