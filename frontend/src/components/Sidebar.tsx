import type { Collection } from '../types';

interface SidebarProps {
  collections: Collection[];
  activeCollectionId: string | null;
  onSelect: (id: string) => void;
  onCreateCollection: () => void;
}

export default function Sidebar({
  collections,
  activeCollectionId,
  onSelect,
  onCreateCollection,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <button className="sidebar-create" onClick={onCreateCollection}>
        + Create Collection
      </button>

      <div className="sidebar-section">Collections</div>

      {collections.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`collection-card ${activeCollectionId === c.id ? 'selected' : ''}`}
        >
          <div>
            <strong>{c.name}</strong>
            <p>{c.description || 'Upload photos to start.'}</p>
          </div>
          <span>{c.photos.length}</span>
        </button>
      ))}
    </aside>
  );
}