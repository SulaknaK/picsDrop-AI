import React, { useState, useEffect, useRef } from 'react';

import type { Collection, Photo, ChatMessage, TabId, PipelineLog, Album } from './types';
import {
  checkHealth,
  createCollection,
  uploadFiles,
  fetchCollectionResults,
  triggerAnalysis,
  askQuestion,
} from './services/api';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PhotoRegistrationPanel from './components/PhotoRegistrationPanel';
import PipelinePanel from './components/PipelinePanel';
import TabNav from './components/TabNav';
import PhotoGallery from './components/PhotoGallery';
import SmartAlbums from './components/SmartAlbums';
import DuplicateGroups from './components/DuplicateGroups';
import AskAgent from './components/AskAgent';
import CreateCollectionModal from './components/CreateCollectionModal';
import PhotoModal from './components/PhotoModal';

export default function App() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('gallery');
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');

  // Registration state
  const [isRegistering, setIsRegistering] = useState(false);
  const [simulatedFiles, setSimulatedFiles] = useState<File[]>([]);

  // Pipeline analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [analysisLogs, setAnalysisLogs] = useState<PipelineLog[]>([]);

  // Chat state
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  // Modals
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Sandbox fallback DB (used when backend is offline)
  const sandboxDB = useRef<{ [id: string]: Collection }>({});

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    const online = await checkHealth();
    setBackendOnline(online);
    if (online) {
      await bootstrapOnlineCollection();
    } else {
      initializeSandbox();
    }
  };

  // ─── Online helpers ───────────────────────────────────────────────────────

  const bootstrapOnlineCollection = async () => {
    if (collections.length === 0) {
      const col = await createCollection('Demo Collection', 'Upload photos to test AI memory pipeline.');
      if (col) {
        setCollections([col]);
        setActiveCollectionId(col.id);
      }
    }
  };

  const refreshCollection = async (id: string) => {
    const data = await fetchCollectionResults(id);
    if (data) {
      setCollections((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: data.status,
                photos: data.photos,
                duplicate_groups: data.duplicate_groups,
                albums: data.albums,
                logs: data.logs,
              }
            : c
        )
      );
    }
  };

  // ─── Sandbox helpers ──────────────────────────────────────────────────────

  const initializeSandbox = () => {
    const id = 'sandbox-col-1';
    const col: Collection = {
      id,
      name: 'Demo Collection',
      description: 'Upload photos to test the AI memory pipeline.',
      created_at: new Date().toISOString(),
      status: 'idle',
      photos: [],
      duplicate_groups: [],
      albums: [],
    };
    sandboxDB.current[id] = col;
    setCollections([col]);
    setActiveCollectionId(id);
  };

  // ─── Collection handlers ──────────────────────────────────────────────────

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    if (backendOnline) {
      const col = await createCollection(newColName, newColDesc);
      if (col) {
        setCollections((prev) => [col, ...prev]);
        setActiveCollectionId(col.id);
      }
    } else {
      const localId = `sandbox-${Math.random().toString(36).substr(2, 9)}`;
      const col: Collection = {
        id: localId,
        name: newColName,
        description: newColDesc,
        created_at: new Date().toISOString(),
        status: 'idle',
        photos: [],
        duplicate_groups: [],
        albums: [],
      };
      sandboxDB.current[localId] = col;
      setCollections((prev) => [col, ...prev]);
      setActiveCollectionId(localId);
    }
    setNewColName('');
    setNewColDesc('');
    setShowCreateModal(false);
  };

  // ─── Photo registration handlers ─────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSimulatedFiles(Array.from(e.target.files));
  };

  const handleUploadFiles = async () => {
    if (!activeCollectionId || simulatedFiles.length === 0) return;
    setIsRegistering(true);

    if (backendOnline) {
      try {
        const result = await uploadFiles(activeCollectionId, simulatedFiles);
        if (result.ok) {
          setSimulatedFiles([]);
          await refreshCollection(activeCollectionId);
        } else {
          alert(`Upload failed: ${result.error}`);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsRegistering(false);
      }
    } else {
      setTimeout(() => {
        const col = sandboxDB.current[activeCollectionId];
        if (col) {
          const newPhotos: Photo[] = simulatedFiles.map((file) => ({
            id: `photo-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            url: URL.createObjectURL(file),
            type: 'upload',
            registered_at: new Date().toISOString(),
            status: 'uploaded',
            quality_score: 0,
            quality_details: { sharpness: 0, composition: 0, lighting: 0, issues: [] },
            caption: '',
            tags: [],
          }));
          col.photos = [...col.photos, ...newPhotos];
          col.status = 'idle';
          setCollections([...collections]);
          setSimulatedFiles([]);
        }
        setIsRegistering(false);
      }, 1000);
    }
  };

  // ─── Analysis handlers ────────────────────────────────────────────────────

  const handleAnalyzeCollection = async () => {
    if (!activeCollectionId || !activeCollection || activeCollection.photos.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisLogs([]);
    setActiveAgent('CoordinatorAgent');

    if (backendOnline) {
      let pollInterval: ReturnType<typeof setInterval> | null = null;
      const stopPolling = () => {
        if (pollInterval !== null) { clearInterval(pollInterval); pollInterval = null; }
        setIsAnalyzing(false);
        setActiveAgent(null);
      };

      try {
        const ok = await triggerAnalysis(activeCollectionId);
        if (ok) {
          let attempts = 0;
          pollInterval = setInterval(async () => {
            attempts++;
            try {
              const data = await fetchCollectionResults(activeCollectionId);
              if (data) {
                setAnalysisLogs(data.logs ?? []);
                const running = (data.logs ?? []).find((l: PipelineLog) => l.status === 'running');
                if (running) setActiveAgent(running.agent);

                if (data.status === 'completed' || data.status === 'failed' || attempts > 60) {
                  stopPolling();
                  setCollections((prev) =>
                    prev.map((c) =>
                      c.id === activeCollectionId
                        ? { ...c, status: data.status, photos: data.photos, duplicate_groups: data.duplicate_groups, albums: data.albums, logs: data.logs }
                        : c
                    )
                  );
                }
              }
            } catch {
              stopPolling();
            }
          }, 1000);
        } else {
          stopPolling();
        }
      } catch (e) {
        console.error(e);
        stopPolling();
      }
    } else {
      simulateSandboxAnalysis(activeCollectionId);
    }
  };

  const simulateSandboxAnalysis = (id: string) => {
    const col = sandboxDB.current[id];
    if (!col) return;

    col.status = 'analyzing';
    setCollections([...collections]);

    const steps: PipelineLog[] = [
      { agent: 'CoordinatorAgent', message: 'Starting sandbox analysis pipeline.', status: 'running' },
      { agent: 'PhotoSourceTool',  message: 'Fetching and reading image sizes...', status: 'running' },
      { agent: 'QualityAgent',     message: 'Evaluating sharpness, lighting, composition...', status: 'running' },
      { agent: 'CaptionAgent',     message: 'Generating descriptions and tags...', status: 'running' },
      { agent: 'DuplicateAgent',   message: 'Locating duplicates...', status: 'running' },
      { agent: 'AlbumAgent',       message: 'Grouping into albums...', status: 'running' },
      { agent: 'CoordinatorAgent', message: 'Pipeline complete.', status: 'completed' },
    ];

    let currentStep = 0;
    const nextStep = () => {
      if (currentStep >= steps.length) {
        col.status = 'completed';
        col.photos = col.photos.map((p) => {
          const n = p.name.toLowerCase();
          let score = 0.85, sharpness = 0.9, composition = 0.8, lighting = 0.85;
          const issues: string[] = [];
          if (n.includes('blur')) { score = 0.35; sharpness = 0.3; issues.push('Motion blur or out of focus'); }
          if (n.includes('dark')) { score = 0.42; lighting = 0.4; issues.push('Underexposed image'); }

          let caption = `A beautiful photograph of ${p.name.split('.')[0]}`;
          let tags = ['photo', 'sandbox', 'memory'];
          if (n.includes('sunset'))  { caption = 'A stunning, vibrant sunset casting warm orange and pink hues across the sky.'; tags = ['sunset', 'sky', 'nature', 'orange']; }
          else if (n.includes('beach'))   { caption = 'Calm ocean waves washing onto a pristine sandy beach under a clear blue sky.'; tags = ['beach', 'ocean', 'sea', 'sand', 'summer', 'nature']; }
          else if (n.includes('food'))    { caption = 'A beautifully plated, delicious gourmet meal featuring fresh ingredients.'; tags = ['food', 'dinner', 'delicious', 'restaurant']; }
          else if (n.includes('mountain')){ caption = 'Majestic snow-capped mountain peaks rising above a lush green pine forest.'; tags = ['mountain', 'hiking', 'nature', 'landscape']; }
          else if (n.includes('coffee'))  { caption = 'A freshly brewed cup of hot coffee with intricate latte art on a wooden table.'; tags = ['coffee', 'beverage', 'cafe', 'latte']; }

          return { ...p, status: 'analyzed', quality_score: score, quality_details: { sharpness, composition, lighting, issues }, caption, tags };
        });

        const dupGroups: string[][] = [];
        const sunsets = col.photos.filter((p) => p.name.includes('sunset'));
        if (sunsets.length >= 2) dupGroups.push(sunsets.map((p) => p.id));
        col.duplicate_groups = dupGroups;

        const albums: Album[] = [];
        const beach = col.photos.filter((p) => p.tags.includes('beach'));
        if (beach.length) albums.push({ id: 'album-beach-local', title: 'Ocean Breeze & Beach Days', description: 'Sun, sand, waves, and coastal memories.', cover_photo_id: beach[0].id, photo_ids: beach.map((p) => p.id) });
        const food = col.photos.filter((p) => p.tags.includes('food') || p.tags.includes('coffee'));
        if (food.length) albums.push({ id: 'album-food-local', title: 'Culinary Explorations', description: 'Delicious meals, drinks, cafes, and foodie adventures.', cover_photo_id: food[0].id, photo_ids: food.map((p) => p.id) });
        const nature = col.photos.filter((p) => p.tags.includes('mountain') || p.tags.includes('sunset'));
        if (nature.length) albums.push({ id: 'album-nature-local', title: 'Scenic Nature', description: 'Breathtaking landscapes, outdoor views, and natural beauty.', cover_photo_id: nature[0].id, photo_ids: nature.map((p) => p.id) });
        col.albums = albums;
        col.logs = steps.map((s) => ({ ...s, status: s.status === 'running' ? 'success' : s.status }));

        setCollections([...collections]);
        setIsAnalyzing(false);
        setActiveAgent(null);
        return;
      }
      const step = steps[currentStep];
      setActiveAgent(step.agent);
      setAnalysisLogs((prev) => [
        ...prev.map((l) => l.status === 'running' ? { ...l, status: 'success' } : l),
        step,
      ]);
      currentStep++;
      setTimeout(nextStep, 1000);
    };
    nextStep();
  };

  // ─── Ask Agent handler ────────────────────────────────────────────────────

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !activeCollectionId) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setQuestion('');
    setIsAsking(true);

    if (backendOnline) {
      try {
        const data = await askQuestion(activeCollectionId, userMsg.text);
        if (data) {
          setChatHistory((prev) => [
            ...prev,
            { sender: 'agent', text: data.answer, sources: data.sources, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsAsking(false);
      }
    } else {
      setTimeout(() => {
        const col = sandboxDB.current[activeCollectionId];
        let answer = "I couldn't locate details about that in the sandbox index. Try asking about 'sunset', 'duplicates', 'albums', or 'blurry' photos.";
        let sources: Photo[] = [];

        if (col) {
          const q = userMsg.text.toLowerCase();
          if (q.includes('duplicate') || q.includes('same')) {
            const numDups = col.duplicate_groups.flat().length;
            answer = `I detected ${col.duplicate_groups.length} duplicate group(s) containing a total of ${numDups} photos. The sunset images have duplicates.`;
            sources = col.photos.filter((p) => p.name.includes('sunset'));
          } else if (q.includes('blur') || q.includes('quality')) {
            const blurry = col.photos.filter((p) => p.quality_score < 0.5);
            answer = `I detected ${blurry.length} blurry/low-quality photo(s): ${blurry.map((p) => p.name).join(', ')}.`;
            sources = blurry;
          } else if (q.includes('sunset')) {
            const sunsets = col.photos.filter((p) => p.tags.includes('sunset'));
            answer = 'Here are the sunset photos I found:\n' + sunsets.map((p) => `- **${p.name}**: "${p.caption}"`).join('\n');
            sources = sunsets;
          } else if (q.includes('beach')) {
            const beach = col.photos.filter((p) => p.tags.includes('beach'));
            answer = 'Here are the beach photos:\n' + beach.map((p) => `- **${p.name}**: "${p.caption}"`).join('\n');
            sources = beach;
          } else if (q.includes('album')) {
            answer = `I created ${col.albums.length} smart albums: ` + col.albums.map((a) => `${a.title} (${a.photo_ids.length} photos)`).join(', ') + '.';
          }
        }

        setChatHistory((prev) => [
          ...prev,
          { sender: 'agent', text: answer, sources: sources.map((p) => ({ id: p.id, name: p.name, url: p.url, caption: p.caption })), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ]);
        setIsAsking(false);
      }, 800);
    }
  };

  // ─── Derived state ────────────────────────────────────────────────────────

  const activeCollection = collections.find((c) => c.id === activeCollectionId) ?? null;
  const photos = activeCollection?.photos ?? [];
  const albums = activeCollection?.albums ?? [];
  const dupsCount = activeCollection?.duplicate_groups.length ?? 0;
  const processedPhotos = photos.filter((p) => p.status === 'analyzed');
  const avgQuality = processedPhotos.length
    ? (processedPhotos.reduce((acc, p) => acc + p.quality_score, 0) / processedPhotos.length).toFixed(2)
    : '0.00';

  const displayedPhotos = selectedAlbumId
    ? photos.filter((p) => albums.find((a) => a.id === selectedAlbumId)?.photo_ids.includes(p.id))
    : photos;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        backendOnline={backendOnline}
        totalPhotos={activeCollection?.photos.length || 0}
        avgQuality={ Number(avgQuality) }
        albumsCount={activeCollection?.albums.length || 0}
        duplicatesCount={activeCollection?.duplicate_groups.length || 0}
      />

      <main className="app-main">
        <Sidebar
          collections={collections}
          activeCollectionId={activeCollectionId}
          onSelect={(id) => { setActiveCollectionId(id); setSelectedAlbumId(null); }}
          onCreateCollection={() => setShowCreateModal(true)}
        />

        <section className="center-workspace">
          {activeCollection ? (
            <>
              {/* <CollectionSummary collection={activeCollection} avgQuality={avgQuality} /> */}

              {photos.length === 0 ? (
                <PhotoRegistrationPanel
                  isRegistering={isRegistering}
                  simulatedFiles={simulatedFiles}
                  onFileChange={handleFileChange}
                  onUploadFiles={handleUploadFiles}
                />
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, overflow: 'hidden' }}>
                  <PipelinePanel
                    collectionStatus={activeCollection.status}
                    isAnalyzing={isAnalyzing}
                    activeAgent={activeAgent}
                    analysisLogs={analysisLogs}
                    onAnalyze={handleAnalyzeCollection}
                  />

                  <TabNav
                    activeTab={activeTab}
                    dupsCount={dupsCount}
                    onTabChange={setActiveTab}
                  />

                  <div className="tab-content-scroll">
                    {activeTab === 'gallery' && (
                      <PhotoGallery
                        photos={displayedPhotos}
                        albums={albums}
                        selectedAlbumId={selectedAlbumId}
                        onClearAlbumFilter={() => setSelectedAlbumId(null)}
                        onSelectPhoto={setSelectedPhoto}
                      />
                    )}
                    {activeTab === 'albums' && (
                      <SmartAlbums
                        albums={albums}
                        photos={photos}
                        onSelectAlbum={(id) => { setSelectedAlbumId(id); setActiveTab('gallery'); }}
                      />
                    )}
                    {activeTab === 'duplicates' && (
                      <DuplicateGroups
                        duplicateGroups={activeCollection.duplicate_groups}
                        photos={photos}
                      />
                    )}
                    {activeTab === 'ask' && (
                      <AskAgent
                        chatHistory={chatHistory}
                        question={question}
                        isAsking={isAsking}
                        photos={photos}
                        onQuestionChange={setQuestion}
                        onSubmit={handleAskQuestion}
                        onSelectPhoto={setSelectedPhoto}
                        onSuggestQuestion={setQuestion}
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#9ca3af' }}>
              Select a collection or create a new one to begin.
            </div>
          )}
        </section>
      </main>

      <footer style={{ padding: '16px 24px', textAlign: 'center', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: '#6b7280' }}>
        PicsDrop AI &copy; 2026. Made with Google Gemini pairing.
      </footer>

      {showCreateModal && (
        <CreateCollectionModal
          name={newColName}
          description={newColDesc}
          onNameChange={setNewColName}
          onDescriptionChange={setNewColDesc}
          onSubmit={handleCreateCollection}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}
