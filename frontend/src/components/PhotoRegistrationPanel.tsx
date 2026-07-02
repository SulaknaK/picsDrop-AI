import React from 'react';

interface PhotoRegistrationPanelProps {
  urlsInput: string;
  onUrlsChange: (value: string) => void;
  onRegisterUrls: () => void;
  isRegistering: boolean;
  simulatedFiles: File[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadFiles: () => void;
}

export default function PhotoRegistrationPanel({
  urlsInput,
  onUrlsChange,
  onRegisterUrls,
  isRegistering,
  simulatedFiles,
  onFileChange,
  onUploadFiles,
}: PhotoRegistrationPanelProps) {
  return (
    <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
      <span style={{ fontSize: '40px' }}>📷</span>
      <h3 className="font-outfit" style={{ margin: '12px 0 6px', fontSize: '16px' }}>
        Add Photos to Start Memory Indexing
      </h3>
      <p style={{ fontSize: '13px', color: '#9ca3af', maxWidth: '500px', margin: '0 auto 20px' }}>
        PicsDrop AI accepts external photo URLs or local file uploads. Try registering our demo photo
        set below to see the agents in action.
      </p>

      <div style={{ display: 'flex', gap: '20px', textAlign: 'left', flexWrap: 'wrap' }}>
        {/* URL Registration Box */}
        <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#d1d5db' }}>
            External Image URLs (One per line)
          </label>
          <textarea
            value={urlsInput}
            onChange={(e) => onUrlsChange(e.target.value)}
            placeholder="Paste image URLs here..."
            style={{
              height: '120px',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(0,0,0,0.2)',
              color: '#fff',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
          />
          <button
            onClick={onRegisterUrls}
            disabled={isRegistering}
            className="glass-panel"
            style={{
              background: 'var(--primary)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              border: 'none',
              fontWeight: '600',
            }}
          >
            {isRegistering ? 'Registering...' : 'Register URLs'}
          </button>
        </div>

        {/* File Upload Box */}
        <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#d1d5db' }}>
            Simulate File Uploads
          </label>
          <div
            style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '8px',
              padding: '30px 10px',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.01)',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <input
              type="file"
              multiple
              onChange={onFileChange}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: '24px' }}>📁</span>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
              Drag files here or click to select
            </p>
          </div>
          {simulatedFiles.length > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '4px' }}>
              Selected {simulatedFiles.length} file(s): {simulatedFiles.map((f) => f.name).join(', ')}
            </div>
          )}
          <button
            onClick={onUploadFiles}
            disabled={simulatedFiles.length === 0 || isRegistering}
            className="glass-panel"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: simulatedFiles.length > 0 ? 'pointer' : 'default',
              border: 'none',
              fontWeight: '600',
              opacity: simulatedFiles.length > 0 ? 1 : 0.5,
            }}
          >
            {isRegistering ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      </div>
    </div>
  );
}
