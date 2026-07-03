interface HeaderProps {
  backendOnline: boolean | null;
  totalPhotos: number;
  avgQuality: number;
  albumsCount: number;
  duplicatesCount: number;
}

export default function Header({
  backendOnline,
  totalPhotos,
  avgQuality,
  albumsCount,
  duplicatesCount,
}: HeaderProps) {
  return (
    <header className="top-header">
      <div className="brand">
        <div className="brand-icon">🖼️</div>
        <div>
          <h1>PicsDrop <span>AI</span></h1>
          <p>AI Event Memory Orchestrator</p>
        </div>
      </div>

      <div className="header-right">
        <div className={`status-pill ${backendOnline ? 'online' : 'offline'}`}>
          <span />
          {backendOnline ? 'API Connected' : 'Demo Mode'}
        </div>

        <div className="header-stats">
          <div><strong>{totalPhotos}</strong><small>Total Photos</small></div>
          <div><strong>{avgQuality.toFixed(2)}</strong><small>Avg Quality</small></div>
          <div><strong>{albumsCount}</strong><small>Albums</small></div>
          <div><strong>{duplicatesCount}</strong><small>Duplicates</small></div>
        </div>
      </div>
    </header>
  );
}