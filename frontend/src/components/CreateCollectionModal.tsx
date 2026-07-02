import React from 'react';

interface CreateCollectionModalProps {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function CreateCollectionModal({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onSubmit,
  onClose,
}: CreateCollectionModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
      }}
    >
      <div className="glass-panel" style={{ width: '400px', padding: '24px' }}>
        <h3
          className="font-outfit"
          style={{ fontSize: '18px', color: '#fff', marginBottom: '16px' }}
        >
          Create New Collection
        </h3>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#9ca3af' }}>Collection Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Hawaii Trip, Family Wedding"
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'rgba(0,0,0,0.2)',
                color: '#fff',
                fontSize: '13px',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#9ca3af' }}>Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Summarize the events in this collection..."
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'rgba(0,0,0,0.2)',
                color: '#fff',
                fontSize: '13px',
                height: '80px',
              }}
            />
          </div>
          <div
            style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="glass-panel"
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
