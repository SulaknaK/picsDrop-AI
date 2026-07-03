import React from 'react';

interface PhotoRegistrationPanelProps {
  isRegistering: boolean;
  simulatedFiles: File[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadFiles: () => void;
}

export default function PhotoRegistrationPanel({
  isRegistering,
  simulatedFiles,
  onFileChange,
  onUploadFiles,
}: PhotoRegistrationPanelProps) {
  return (
    <section className="upload-hero-card">
      <div className="upload-hero-copy">
        <div className="eyebrow">AI Photo Memory Pipeline</div>
        <h1>
          Upload Photos to Start <span>AI Memory Indexing</span>
        </h1>
        <p>
          Add event photos from your computer. PicsDrop AI uses Gemini Vision to
          analyze quality, create captions, detect duplicates, build smart albums,
          and answer questions.
        </p>

        <div className="feature-row">
          <div>✨ AI Analysis</div>
          <div>✅ Quality</div>
          <div>🧩 Duplicates</div>
          <div>📁 Albums</div>
          <div>💬 Ask Agent</div>
        </div>
      </div>

      <label className="upload-box">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={onFileChange}
        />

        <div className="upload-cloud">☁️</div>
        <h2>Click to browse</h2>
        <small>Supports JPG, PNG, HEIC and more</small>
      </label>

      {simulatedFiles.length > 0 && (
        <div className="selected-files">
          Selected {simulatedFiles.length} file(s):{' '}
          {simulatedFiles.map((f) => f.name).join(', ')}
        </div>
      )}

      <button
        className="upload-submit"
        onClick={onUploadFiles}
        disabled={simulatedFiles.length === 0 || isRegistering}
      >
        {isRegistering ? 'Uploading...' : 'Upload Photos'}
      </button>
    </section>
  );
}