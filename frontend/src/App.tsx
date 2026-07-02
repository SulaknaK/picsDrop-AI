import React, { useState, useEffect, useRef } from 'react';

// API URL definition
const API_BASE_URL = 'http://localhost:8000';

interface Photo {
  id: string;
  name: string;
  url: string;
  type: string;
  registered_at: string;
  status: string;
  quality_score: number;
  quality_details: {
    sharpness: number;
    composition: number;
    lighting: number;
    issues: string[];
  };
  caption: string;
  tags: string[];
}

interface Album {
  id: string;
  title: string;
  description: string;
  cover_photo_id: string;
  photo_ids: string[];
}

interface PipelineLog {
  agent: string;
  message: string;
  status: string;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  created_at: string;
  status: string;
  photos: Photo[];
  duplicate_groups: string[][];
  albums: Album[];
  logs?: PipelineLog[];
}

interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  sources?: { id: string; name: string; url: string; caption: string }[];
  timestamp: string;
}

const DEFAULT_URLS = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600#/sunset.jpg",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600#/sunset_dup.jpg",
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600#/beach_paradise.jpg",
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&blur=30#/beach_blurry.jpg",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600#/gourmet_food.jpg",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600#/mountain_peak.jpg",
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600#/coffee_latte.jpg"
].join('\n');

export default function App() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'gallery' | 'albums' | 'duplicates' | 'ask'>('gallery');
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  
  // Registration state
  const [urlsInput, setUrlsInput] = useState(DEFAULT_URLS);
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

  // Modal inspection
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  
  // Connection Status (Checks if backend is online)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fallback state for Browser sandbox database
  const sandboxDB = useRef<{ [id: string]: Collection }>({});

  useEffect(() => {
    checkBackendHealth();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const checkBackendHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/`);
      if (res.ok) {
        setBackendOnline(true);
        fetchCollections(true);
      } else {
        throw new Error("Offline");
      }
    } catch (e) {
      setBackendOnline(false);
      // Load fallback demo collections
      initializeSandbox();
    }
  };

  const fetchCollections = async (selectFirst = false) => {
    try {
      // In a real app we'd have GET /collections. For our endpoints, we track active collection.
      // Since our mock database starts fresh, we create a default collection if empty.
      if (collections.length === 0) {
        const defaultCol = await createCollectionOnAPI("Summer Getaway 2026", "A demo collection of summer photos.");
        if (defaultCol) {
          setCollections([defaultCol]);
          setActiveCollectionId(defaultCol.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const initializeSandbox = () => {
    const sandboxId = "sandbox-col-1";
    const demoCol: Collection = {
      id: sandboxId,
      name: "Hawaii Sunset & Food (Sandbox)",
      description: "Running completely in-browser since FastAPI backend is offline.",
      created_at: new Date().toISOString(),
      status: "idle",
      photos: [],
      duplicate_groups: [],
      albums: []
    };
    sandboxDB.current[sandboxId] = demoCol;
    setCollections([demoCol]);
    setActiveCollectionId(sandboxId);
  };

  const createCollectionOnAPI = async (name: string, description: string): Promise<Collection | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id,
          name: data.name,
          description: data.description,
          created_at: data.created_at,
          status: data.status,
          photos: [],
          duplicate_groups: [],
          albums: []
        };
      }
    } catch (e) {
      console.error("API Error creating collection:", e);
    }
    return null;
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    if (backendOnline) {
      const newCol = await createCollectionOnAPI(newColName, newColDesc);
      if (newCol) {
        setCollections(prev => [newCol, ...prev]);
        setActiveCollectionId(newCol.id);
        setNewColName('');
        setNewColDesc('');
        setShowCreateModal(false);
      }
    } else {
      const localId = `sandbox-${Math.random().toString(36).substr(2, 9)}`;
      const newCol: Collection = {
        id: localId,
        name: newColName,
        description: newColDesc,
        created_at: new Date().toISOString(),
        status: "idle",
        photos: [],
        duplicate_groups: [],
        albums: []
      };
      sandboxDB.current[localId] = newCol;
      setCollections(prev => [newCol, ...prev]);
      setActiveCollectionId(localId);
      setNewColName('');
      setNewColDesc('');
      setShowCreateModal(false);
    }
  };

  const activeCollection = collections.find(c => c.id === activeCollectionId) || null;

  const handleRegisterUrls = async () => {
    if (!activeCollectionId || !urlsInput.trim()) return;
    setIsRegistering(true);

    const urls = urlsInput.split('\n').map(u => u.trim()).filter(Boolean);

    if (backendOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/collections/${activeCollectionId}/photos/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls })
        });
        if (res.ok) {
          await refreshCollectionResults(activeCollectionId);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsRegistering(false);
      }
    } else {
      // Simulate local registration
      setTimeout(() => {
        const col = sandboxDB.current[activeCollectionId];
        if (col) {
          const registeredPhotos: Photo[] = urls.map((url, i) => {
            const photoId = `photo-${Math.random().toString(36).substr(2, 9)}`;
            const name = url.split('/').pop()?.split('#').pop() || `image_${i}.jpg`;
            return {
              id: photoId,
              name: name,
              url: url,
              type: 'url',
              registered_at: new Date().toISOString(),
              status: 'registered',
              quality_score: 0.0,
              quality_details: { sharpness: 0, composition: 0, lighting: 0, issues: [] },
              caption: '',
              tags: []
            };
          });
          col.photos = [...col.photos, ...registeredPhotos];
          col.status = "idle";
          setCollections([...collections]);
        }
        setIsRegistering(false);
      }, 800);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSimulatedFiles(Array.from(e.target.files));
    }
  };

  const handleUploadPhotos = async () => {
    if (!activeCollectionId || simulatedFiles.length === 0) return;
    setIsRegistering(true);

    if (backendOnline) {
      try {
        const formData = new FormData();
        simulatedFiles.forEach(file => {
          formData.append("files", file);
        });

        const res = await fetch(`${API_BASE_URL}/collections/${activeCollectionId}/photos/upload`, {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          setSimulatedFiles([]);
          await refreshCollectionResults(activeCollectionId);
        } else {
          const errData = await res.json();
          alert(`Upload failed: ${errData.detail || 'Unknown error'}`);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsRegistering(false);
      }
    } else {
      // Simulate file upload in sandbox
      setTimeout(() => {
        const col = sandboxDB.current[activeCollectionId];
        if (col) {
          const uploadedPhotos: Photo[] = simulatedFiles.map(file => {
            const photoId = `photo-${Math.random().toString(36).substr(2, 9)}`;
            // Create a mock object url
            const mockUrl = URL.createObjectURL(file);
            return {
              id: photoId,
              name: file.name,
              url: mockUrl,
              type: 'upload',
              registered_at: new Date().toISOString(),
              status: 'uploaded',
              quality_score: 0.0,
              quality_details: { sharpness: 0, composition: 0, lighting: 0, issues: [] },
              caption: '',
              tags: []
            };
          });
          col.photos = [...col.photos, ...uploadedPhotos];
          col.status = "idle";
          setCollections([...collections]);
          setSimulatedFiles([]);
        }
        setIsRegistering(false);
      }, 1000);
    }
  };

  const refreshCollectionResults = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/collections/${id}/results`);
      if (res.ok) {
        const data = await res.json();
        setCollections(prev => prev.map(c => c.id === id ? {
          ...c,
          status: data.status,
          photos: data.photos,
          duplicate_groups: data.duplicate_groups,
          albums: data.albums,
          logs: data.logs
        } : c));
      }
    } catch (e) {
      console.error("Error refreshing collection:", e);
    }
  };

  // Triggers CoordinatorAgent pipeline
  const handleAnalyzeCollection = async () => {
    if (!activeCollectionId || !activeCollection || activeCollection.photos.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysisLogs([]);
    setActiveAgent("CoordinatorAgent");

    if (backendOnline) {
      let pollInterval: ReturnType<typeof setInterval> | null = null;
      const stopPolling = () => {
        if (pollInterval !== null) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        setIsAnalyzing(false);
        setActiveAgent(null);
      };

      try {
        const triggerRes = await fetch(`${API_BASE_URL}/collections/${activeCollectionId}/analyze`, {
          method: 'POST'
        });
        
        if (triggerRes.ok) {
          // Poll results until complete
          let attempts = 0;
          
          pollInterval = setInterval(async () => {
            attempts++;
            try {
              const res = await fetch(`${API_BASE_URL}/collections/${activeCollectionId}/results`);
              if (res.ok) {
                const data = await res.json();
                setAnalysisLogs(data.logs || []);
                
                // Find active agent from running log
                const activeLog = (data.logs || []).find((l: any) => l.status === "running");
                if (activeLog) {
                  setActiveAgent(activeLog.agent);
                }
                
                if (data.status === "completed" || data.status === "failed" || attempts > 60) {
                  stopPolling();
                  
                  // Update full collection model
                  setCollections(prev => prev.map(c => c.id === activeCollectionId ? {
                    ...c,
                    status: data.status,
                    photos: data.photos,
                    duplicate_groups: data.duplicate_groups,
                    albums: data.albums,
                    logs: data.logs
                  } : c));
                }
              }
            } catch (pollErr) {
              console.error("Polling error:", pollErr);
              stopPolling();
            }
          }, 1000);
        } else {
          // Trigger request itself failed
          stopPolling();
        }
      } catch (e) {
        console.error(e);
        stopPolling();
      }
    } else {
      // Simulate Sandbox analysis steps
      simulateSandboxAnalysis(activeCollectionId);
    }
  };

  const simulateSandboxAnalysis = (id: string) => {
    const col = sandboxDB.current[id];
    if (!col) return;

    col.status = "analyzing";
    setCollections([...collections]);
    
    const steps = [
      { agent: "CoordinatorAgent", message: "Starting sandbox analysis pipeline.", status: "running" },
      { agent: "PhotoSourceTool", message: "Fetching and reading image sizes...", status: "running" },
      { agent: "QualityAgent", message: "Evaluating sharpness, lighting, composition...", status: "running" },
      { agent: "CaptionAgent", message: "Generating descriptions and tags...", status: "running" },
      { agent: "DuplicateAgent", message: "Locating duplicates...", status: "running" },
      { agent: "AlbumAgent", message: "Grouping into albums...", status: "running" },
      { agent: "CoordinatorAgent", message: "Pipeline complete.", status: "completed" }
    ];

    let currentStep = 0;
    
    const nextStep = () => {
      if (currentStep >= steps.length) {
        // Finalize sandbox state
        col.status = "completed";
        
        // Generate mock quality scores/captions/tags deterministically
        col.photos = col.photos.map(p => {
          const nameLower = p.name.toLowerCase();
          let score = 0.85;
          let issues: string[] = [];
          let sharpness = 0.9;
          let composition = 0.8;
          let lighting = 0.85;
          
          if (nameLower.includes("blur")) {
            score = 0.35;
            sharpness = 0.3;
            issues.push("Motion blur or out of focus");
          }
          if (nameLower.includes("dark")) {
            score = 0.42;
            lighting = 0.4;
            issues.push("Underexposed image");
          }

          let caption = `A beautiful photograph of ${p.name.split('.')[0]}`;
          let tags = ["photo", "sandbox", "memory"];

          if (nameLower.includes("sunset")) {
            caption = "A stunning, vibrant sunset casting warm orange and pink hues across the sky.";
            tags = ["sunset", "sky", "nature", "orange"];
          } else if (nameLower.includes("beach")) {
            caption = "Calm ocean waves washing onto a pristine sandy beach under a clear blue sky.";
            tags = ["beach", "ocean", "sea", "sand", "summer", "nature"];
          } else if (nameLower.includes("food")) {
            caption = "A beautifully plated, delicious gourmet meal featuring fresh ingredients.";
            tags = ["food", "dinner", "delicious", "restaurant"];
          } else if (nameLower.includes("mountain")) {
            caption = "Majestic snow-capped mountain peaks rising above a lush green pine forest.";
            tags = ["mountain", "hiking", "nature", "landscape"];
          } else if (nameLower.includes("coffee")) {
            caption = "A freshly brewed cup of hot coffee with intricate latte art on a wooden table.";
            tags = ["coffee", "beverage", "cafe", "latte"];
          }

          return {
            ...p,
            status: "analyzed",
            quality_score: score,
            quality_details: { sharpness, composition, lighting, issues },
            caption,
            tags
          };
        });

        // Generate duplicates
        const dupGroups: string[][] = [];
        const sunsetPhotos = col.photos.filter(p => p.name.includes("sunset"));
        if (sunsetPhotos.length >= 2) {
          dupGroups.push(sunsetPhotos.map(p => p.id));
        }
        col.duplicate_groups = dupGroups;

        // Generate albums
        const albums: Album[] = [];
        const beachPhotos = col.photos.filter(p => p.tags.includes("beach"));
        if (beachPhotos.length > 0) {
          albums.push({
            id: "album-beach-local",
            title: "Ocean Breeze & Beach Days",
            description: "Sun, sand, waves, and coastal memories.",
            cover_photo_id: beachPhotos[0].id,
            photo_ids: beachPhotos.map(p => p.id)
          });
        }
        const foodPhotos = col.photos.filter(p => p.tags.includes("food") || p.tags.includes("coffee"));
        if (foodPhotos.length > 0) {
          albums.push({
            id: "album-food-local",
            title: "Culinary Explorations",
            description: "Delicious meals, drinks, cafes, and foodie adventures.",
            cover_photo_id: foodPhotos[0].id,
            photo_ids: foodPhotos.map(p => p.id)
          });
        }
        const naturePhotos = col.photos.filter(p => p.tags.includes("mountain") || p.tags.includes("sunset"));
        if (naturePhotos.length > 0) {
          albums.push({
            id: "album-nature-local",
            title: "Scenic Nature",
            description: "Breathtaking landscapes, outdoor views, and natural beauty.",
            cover_photo_id: naturePhotos[0].id,
            photo_ids: naturePhotos.map(p => p.id)
          });
        }

        col.albums = albums;
        col.logs = steps.map(s => ({ ...s, status: s.status === "running" ? "success" : s.status }));
        
        setCollections([...collections]);
        setIsAnalyzing(false);
        setActiveAgent(null);
        return;
      }

      const activeStep = steps[currentStep];
      setActiveAgent(activeStep.agent);
      setAnalysisLogs(prev => {
        // Update previous running steps to success
        const updated = prev.map(l => l.status === "running" ? { ...l, status: "success" } : l);
        return [...updated, activeStep];
      });

      currentStep++;
      setTimeout(nextStep, 1000);
    };

    nextStep();
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !activeCollectionId) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setQuestion('');
    setIsAsking(true);

    if (backendOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/collections/${activeCollectionId}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: userMsg.text })
        });
        if (res.ok) {
          const data = await res.json();
          setChatHistory(prev => [...prev, {
            sender: 'agent',
            text: data.answer,
            sources: data.sources,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsAsking(false);
      }
    } else {
      // Sandbox QA simulation
      setTimeout(() => {
        const col = sandboxDB.current[activeCollectionId];
        let answer = "I couldn't locate details about that in the sandbox index. Try asking about 'sunset', 'duplicates', 'albums', or 'blurry' photos.";
        let sources: any[] = [];

        if (col) {
          const q = userMsg.text.toLowerCase();
          if (q.includes("duplicate") || q.includes("same")) {
            const numDups = col.duplicate_groups.flat().length;
            answer = `I detected ${col.duplicate_groups.length} duplicate group(s) containing a total of ${numDups} photos. The sunset images have duplicates.`;
            sources = col.photos.filter(p => p.name.includes("sunset"));
          } else if (q.includes("blur") || q.includes("quality")) {
            const blurry = col.photos.filter(p => p.quality_score < 0.5);
            answer = `I detected ${blurry.length} blurry/low-quality photo(s) in this collection: ${blurry.map(p => p.name).join(', ')}.`;
            sources = blurry;
          } else if (q.includes("sunset")) {
            const sunsets = col.photos.filter(p => p.tags.includes("sunset"));
            answer = `Here are the sunset photos I found:\n` + sunsets.map(p => `- **${p.name}**: "${p.caption}"`).join('\n');
            sources = sunsets;
          } else if (q.includes("beach")) {
            const beach = col.photos.filter(p => p.tags.includes("beach"));
            answer = `Here are the beach photos from the collection:\n` + beach.map(p => `- **${p.name}**: "${p.caption}"`).join('\n');
            sources = beach;
          } else if (q.includes("album")) {
            answer = `I created ${col.albums.length} smart albums: ` + col.albums.map(a => `${a.title} (${a.photo_ids.length} photos)`).join(', ') + ".";
          }
        }

        setChatHistory(prev => [...prev, {
          sender: 'agent',
          text: answer,
          sources: sources.map(p => ({ id: p.id, name: p.name, url: p.url, caption: p.caption })),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsAsking(false);
      }, 800);
    }
  };

  const getQualityBadgeColor = (score: number) => {
    if (score >= 0.8) return 'badge-success';
    if (score >= 0.5) return 'badge-warning';
    return 'badge-danger';
  };

  // Compute stats
  const photos = activeCollection?.photos || [];
  const processedPhotos = photos.filter(p => p.status === "analyzed");
  const albums = activeCollection?.albums || [];
  const dupsCount = activeCollection?.duplicate_groups.length || 0;
  const avgQuality = processedPhotos.length 
    ? (processedPhotos.reduce((acc, p) => acc + p.quality_score, 0) / processedPhotos.length).toFixed(2)
    : '0.00';

  // Filter photos by selected album
  const displayedPhotos = selectedAlbumId && activeCollection
    ? photos.filter(p => activeCollection.albums.find(a => a.id === selectedAlbumId)?.photo_ids.includes(p.id))
    : photos;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header className="glass-panel app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>📸</span>
          <div>
            <h1 className="font-outfit" style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff' }}>
              PicsDrop <span className="text-gradient-primary">AI</span>
            </h1>
            <p style={{ fontSize: '11px', color: '#9ca3af' }}>AI Event Memory Orchestrator</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '6px 12px', borderRadius: '30px', background: 'rgba(255,255,255,0.05)' }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: backendOnline ? 'var(--success)' : 'var(--warning)',
              display: 'inline-block'
            }} />
            <span>{backendOnline ? 'API Connected' : 'Browser Sandbox'}</span>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="glass-panel" 
            style={{ 
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', 
              border: 'none', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '8px', 
              fontSize: '13px', 
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            + Create Collection
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="app-main">
        {/* Left Sidebar: Collections */}
        <section className="glass-panel sidebar-collections">
          <h3 className="font-outfit" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', marginBottom: '16px' }}>Collections</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
            {collections.map(c => (
              <div 
                key={c.id} 
                onClick={() => {
                  setActiveCollectionId(c.id);
                  setSelectedAlbumId(null);
                }}
                className={`glass-panel glass-panel-interactive`}
                style={{ 
                  padding: '12px', 
                  cursor: 'pointer',
                  borderColor: activeCollectionId === c.id ? 'var(--primary)' : 'var(--border-color)',
                  background: activeCollectionId === c.id ? 'rgba(99, 102, 241, 0.08)' : 'rgba(17, 24, 39, 0.4)'
                }}
              >
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: activeCollectionId === c.id ? '#fff' : '#d1d5db' }}>{c.name}</h4>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {c.description || 'No description'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '10px' }}>
                  <span style={{ color: '#6b7280' }}>
                    {c.photos.length} photos
                  </span>
                  <span style={{ 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    background: c.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : c.status === 'analyzing' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: c.status === 'completed' ? 'var(--success)' : c.status === 'analyzing' ? 'var(--secondary)' : '#9ca3af'
                  }}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Center Panel Workspace */}
        <section className="center-workspace">
          {activeCollection ? (
            <>
              {/* Collection Banner Stats */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className="font-outfit" style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>{activeCollection.name}</h2>
                  <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>{activeCollection.description}</p>
                </div>
                
                {/* Micro Stats Indicators */}
                <div className="stats-row">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>{photos.length}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>Total Photos</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--success)' }}>{avgQuality}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>Avg Quality</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--secondary)' }}>{albums.length}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>Albums</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--warning)' }}>{dupsCount}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>Duplicates</div>
                  </div>
                </div>
              </div>

              {/* Photo Registration / Analyze Control Panel */}
              {photos.length === 0 ? (
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
                  <span style={{ fontSize: '40px' }}>📷</span>
                  <h3 className="font-outfit" style={{ margin: '12px 0 6px', fontSize: '16px' }}>Add Photos to Start Memory Indexing</h3>
                  <p style={{ fontSize: '13px', color: '#9ca3af', maxWidth: '500px', margin: '0 auto 20px' }}>
                    PicsDrop AI accepts external photo URLs or local file uploads. Try registering our demo photo set below to see the agents in action.
                  </p>

                  <div style={{ display: 'flex', gap: '20px', textAlign: 'left', flexWrap: 'wrap' }}>
                    {/* URL Registration Box */}
                    <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#d1d5db' }}>External Image URLs (One per line)</label>
                      <textarea
                        value={urlsInput}
                        onChange={(e) => setUrlsInput(e.target.value)}
                        placeholder="Paste image URLs here..."
                        style={{ height: '120px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
                      />
                      <button
                        onClick={handleRegisterUrls}
                        disabled={isRegistering}
                        className="glass-panel"
                        style={{ background: 'var(--primary)', color: '#fff', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', border: 'none', fontWeight: '600' }}
                      >
                        {isRegistering ? 'Registering...' : 'Register URLs'}
                      </button>
                    </div>

                    {/* File Upload Box */}
                    <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#d1d5db' }}>Simulate File Uploads</label>
                      <div 
                        style={{ 
                          border: '2px dashed var(--border-color)', 
                          borderRadius: '8px', 
                          padding: '30px 10px', 
                          textAlign: 'center',
                          background: 'rgba(255,255,255,0.01)',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                      >
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '24px' }}>📁</span>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                          Drag files here or click to select
                        </p>
                      </div>
                      {simulatedFiles.length > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '4px' }}>
                          Selected {simulatedFiles.length} file(s): {simulatedFiles.map(f => f.name).join(', ')}
                        </div>
                      )}
                      <button
                        onClick={handleUploadPhotos}
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
                          opacity: simulatedFiles.length > 0 ? 1 : 0.5
                        }}
                      >
                        {isRegistering ? 'Uploading...' : 'Upload Files'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Main Working View (Tab switcher + Content) */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, overflow: 'hidden' }}>
                  {/* Pipeline Trigger & Pipeline Visualization Box */}
                  <div className="glass-panel" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h4 className="font-outfit" style={{ fontSize: '14px', color: '#fff' }}>Agentic Indexing Pipeline</h4>
                        <p style={{ fontSize: '11px', color: '#9ca3af' }}>Runs coordinator and specialized agents sequentially</p>
                      </div>
                      
                      {!isAnalyzing && (activeCollection.status === "idle" || activeCollection.status === "completed" || activeCollection.status === "failed") && (
                        <button
                          onClick={handleAnalyzeCollection}
                          className="glass-panel"
                          style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}
                        >
                          {activeCollection.status === "completed" ? '🔄 Re-analyze' : '🔮 Run AI Analysis'}
                        </button>
                      )}
                      {isAnalyzing && (
                        <span style={{ fontSize: '12px', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="spinner" style={{ display: 'inline-block' }}>⚙️</span> Analyzing…
                        </span>
                      )}
                    </div>

                    {/* SVG/CSS Agent Nodes Flow Map */}
                    <div className="pipeline-agent-row">
                      
                      {/* Coordinator */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, minWidth: '90px' }}>
                        <div className={`glass-panel ${activeAgent === 'CoordinatorAgent' ? 'glow-active' : ''}`} style={{ 
                          width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                          background: activeCollection.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : activeAgent === 'CoordinatorAgent' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          borderColor: activeCollection.status === 'completed' ? 'var(--success)' : activeAgent === 'CoordinatorAgent' ? 'var(--secondary)' : 'var(--border-color)'
                        }}>
                          👑
                        </div>
                        <span style={{ fontSize: '10px', marginTop: '6px', fontWeight: '600', color: activeAgent === 'CoordinatorAgent' ? 'var(--secondary)' : '#fff' }}>Coordinator</span>
                      </div>

                      {/* Line */}
                      <svg style={{ flex: 1, height: '4px', minWidth: '40px' }}>
                        <line x1="0%" y1="50%" x2="100%" y2="50%" stroke={isAnalyzing ? 'var(--secondary)' : 'var(--border-color)'} strokeWidth="2" 
                              className={isAnalyzing ? 'flow-line' : ''} />
                      </svg>

                      {/* QualityAgent */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, minWidth: '90px' }}>
                        <div className={`glass-panel ${activeAgent === 'QualityAgent' ? 'glow-active' : ''}`} style={{ 
                          width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                          background: activeCollection.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : activeAgent === 'QualityAgent' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          borderColor: activeCollection.status === 'completed' ? 'var(--success)' : activeAgent === 'QualityAgent' ? 'var(--primary)' : 'var(--border-color)'
                        }}>
                          ✨
                        </div>
                        <span style={{ fontSize: '10px', marginTop: '6px', fontWeight: '600', color: activeAgent === 'QualityAgent' ? 'var(--primary)' : '#fff' }}>QualityAgent</span>
                      </div>

                      {/* Line */}
                      <svg style={{ flex: 1, height: '4px', minWidth: '40px' }}>
                        <line x1="0%" y1="50%" x2="100%" y2="50%" stroke={isAnalyzing ? 'var(--primary)' : 'var(--border-color)'} strokeWidth="2" 
                              className={isAnalyzing ? 'flow-line' : ''} />
                      </svg>

                      {/* CaptionAgent */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, minWidth: '90px' }}>
                        <div className={`glass-panel ${activeAgent === 'CaptionAgent' ? 'glow-active' : ''}`} style={{ 
                          width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                          background: activeCollection.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : activeAgent === 'CaptionAgent' ? 'rgba(20, 184, 166, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          borderColor: activeCollection.status === 'completed' ? 'var(--success)' : activeAgent === 'CaptionAgent' ? 'var(--accent)' : 'var(--border-color)'
                        }}>
                          📝
                        </div>
                        <span style={{ fontSize: '10px', marginTop: '6px', fontWeight: '600', color: activeAgent === 'CaptionAgent' ? 'var(--accent)' : '#fff' }}>CaptionAgent</span>
                      </div>

                      {/* Line */}
                      <svg style={{ flex: 1, height: '4px', minWidth: '40px' }}>
                        <line x1="0%" y1="50%" x2="100%" y2="50%" stroke={isAnalyzing ? 'var(--accent)' : 'var(--border-color)'} strokeWidth="2" 
                              className={isAnalyzing ? 'flow-line' : ''} />
                      </svg>

                      {/* DuplicateAgent */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, minWidth: '90px' }}>
                        <div className={`glass-panel ${activeAgent === 'DuplicateAgent' ? 'glow-active' : ''}`} style={{ 
                          width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                          background: activeCollection.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : activeAgent === 'DuplicateAgent' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          borderColor: activeCollection.status === 'completed' ? 'var(--success)' : activeAgent === 'DuplicateAgent' ? 'var(--warning)' : 'var(--border-color)'
                        }}>
                          👯
                        </div>
                        <span style={{ fontSize: '10px', marginTop: '6px', fontWeight: '600', color: activeAgent === 'DuplicateAgent' ? 'var(--warning)' : '#fff' }}>DuplicateAgent</span>
                      </div>

                      {/* Line */}
                      <svg style={{ flex: 1, height: '4px', minWidth: '40px' }}>
                        <line x1="0%" y1="50%" x2="100%" y2="50%" stroke={isAnalyzing ? 'var(--warning)' : 'var(--border-color)'} strokeWidth="2" 
                              className={isAnalyzing ? 'flow-line' : ''} />
                      </svg>

                      {/* AlbumAgent */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, minWidth: '90px' }}>
                        <div className={`glass-panel ${activeAgent === 'AlbumAgent' ? 'glow-active' : ''}`} style={{ 
                          width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                          background: activeCollection.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : activeAgent === 'AlbumAgent' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          borderColor: activeCollection.status === 'completed' ? 'var(--success)' : activeAgent === 'AlbumAgent' ? 'var(--success)' : 'var(--border-color)'
                        }}>
                          🗂️
                        </div>
                        <span style={{ fontSize: '10px', marginTop: '6px', fontWeight: '600', color: activeAgent === 'AlbumAgent' ? 'var(--success)' : '#fff' }}>AlbumAgent</span>
                      </div>

                    </div>

                    {/* Agent Live Running Terminal Logs */}
                    {(isAnalyzing || analysisLogs.length > 0) && (
                      <div style={{ marginTop: '12px', background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 14px', maxHeight: '100px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {analysisLogs.map((log, index) => (
                          <div key={index} style={{ color: log.status === 'running' ? 'var(--secondary)' : log.status === 'warning' ? 'var(--warning)' : '#10b981' }}>
                            <span>[{log.agent}]</span> {log.message} {isAnalyzing && log.status === 'running' && <span className="spinner" style={{ display: 'inline-block' }}>⚙️</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tabs Switcher */}
                  <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                    <button 
                      onClick={() => setActiveTab('gallery')}
                      style={{ 
                        background: 'none', border: 'none', color: activeTab === 'gallery' ? '#fff' : '#6b7280', fontSize: '14px', fontWeight: '600', padding: '8px 12px', cursor: 'pointer',
                        borderBottom: activeTab === 'gallery' ? '2px solid var(--primary)' : 'none'
                      }}
                    >
                      🖼️ Photos & Quality
                    </button>
                    <button 
                      onClick={() => setActiveTab('albums')}
                      style={{ 
                        background: 'none', border: 'none', color: activeTab === 'albums' ? '#fff' : '#6b7280', fontSize: '14px', fontWeight: '600', padding: '8px 12px', cursor: 'pointer',
                        borderBottom: activeTab === 'albums' ? '2px solid var(--primary)' : 'none'
                      }}
                    >
                      🗂️ Smart Albums
                    </button>
                    <button 
                      onClick={() => setActiveTab('duplicates')}
                      style={{ 
                        background: 'none', border: 'none', color: activeTab === 'duplicates' ? '#fff' : '#6b7280', fontSize: '14px', fontWeight: '600', padding: '8px 12px', cursor: 'pointer',
                        borderBottom: activeTab === 'duplicates' ? '2px solid var(--primary)' : 'none'
                      }}
                    >
                      👯 Duplicates ({dupsCount})
                    </button>
                    <button 
                      onClick={() => setActiveTab('ask')}
                      style={{ 
                        background: 'none', border: 'none', color: activeTab === 'ask' ? '#fff' : '#6b7280', fontSize: '14px', fontWeight: '600', padding: '8px 12px', cursor: 'pointer',
                        borderBottom: activeTab === 'ask' ? '2px solid var(--primary)' : 'none'
                      }}
                    >
                      💬 Ask Agent
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="tab-content-scroll">
                    
                    {/* Tab 1: Photo Gallery & Quality Inspection */}
                    {activeTab === 'gallery' && (
                      <div>
                        {selectedAlbumId && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                            <span>Showing album: <strong>{albums.find(a => a.id === selectedAlbumId)?.title}</strong></span>
                            <button onClick={() => setSelectedAlbumId(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Clear Filter</button>
                          </div>
                        )}

                        <div className="photo-grid">
                          {displayedPhotos.map(p => (
                            <div 
                              key={p.id}
                              onClick={() => setSelectedPhoto(p)}
                              className="glass-panel glass-panel-interactive"
                              style={{ overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                            >
                              <div style={{ width: '100%', height: '120px', position: 'relative', background: '#0e1217' }}>
                                <img src={p.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                
                                {/* Status badge */}
                                {p.status === 'analyzed' ? (
                                  <span style={{ 
                                    position: 'absolute', top: '8px', right: '8px', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
                                    background: p.quality_score >= 0.8 ? 'rgba(16, 185, 129, 0.9)' : p.quality_score >= 0.5 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                                    color: '#fff'
                                  }}>
                                    Q: {p.quality_score}
                                  </span>
                                ) : (
                                  <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '9px', background: 'rgba(0,0,0,0.6)', color: '#aaa', padding: '2px 5px', borderRadius: '4px' }}>
                                    {p.status}
                                  </span>
                                )}
                              </div>
                              <div style={{ padding: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#fff' }}>
                                  {p.name.split('/').pop()}
                                </div>
                                {p.caption && (
                                  <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {p.caption}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Smart Albums View */}
                    {activeTab === 'albums' && (
                      <div>
                        {albums.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '13px' }}>
                            Albums will be created dynamically based on visual categories once analysis runs.
                          </div>
                        ) : (
                          <div className="album-grid">
                            {albums.map(a => {
                              const coverPhoto = photos.find(p => p.id === a.cover_photo_id);
                              return (
                                <div 
                                  key={a.id}
                                  onClick={() => {
                                    setSelectedAlbumId(a.id);
                                    setActiveTab('gallery');
                                  }}
                                  className="glass-panel glass-panel-interactive"
                                  style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                                >
                                  <div style={{ height: '140px', width: '100%', background: '#0e1217', position: 'relative' }}>
                                    {coverPhoto && <img src={coverPhoto.url} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', fontSize: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>
                                      {a.photo_ids.length} photos
                                    </div>
                                  </div>
                                  <div style={{ padding: '14px' }}>
                                    <h4 className="font-outfit" style={{ fontSize: '15px', color: '#fff', fontWeight: '700' }}>{a.title}</h4>
                                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px', lineHeight: '1.4' }}>{a.description}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Duplicate Groups Comparator */}
                    {activeTab === 'duplicates' && (
                      <div>
                        {activeCollection.duplicate_groups.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '13px' }}>
                            No duplicate groupings found. Visual indexing groups highly similar photos side-by-side.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {activeCollection.duplicate_groups.map((group, idx) => (
                              <div key={idx} className="glass-panel" style={{ padding: '16px' }}>
                                <h4 className="font-outfit" style={{ fontSize: '13px', color: 'var(--warning)', marginBottom: '12px', fontWeight: '700' }}>
                                  Duplicate Group #{idx + 1}
                                </h4>
                                <div className="duplicate-cards-row">
                                  {group.map((pid, pIdx) => {
                                    const p = photos.find(x => x.id === pid);
                                    if (!p) return null;
                                    
                                    // Check if this photo has the highest quality score in the group
                                    const groupScores = group.map(gId => photos.find(x => x.id === gId)?.quality_score || 0);
                                    const maxScore = Math.max(...groupScores);
                                    const isBest = p.quality_score === maxScore && p.quality_score > 0;

                                    return (
                                      <div key={pid} className="glass-panel" style={{ width: '150px', overflow: 'hidden', border: isBest ? '1.5px solid var(--success)' : '1px solid var(--border-color)', position: 'relative' }}>
                                        <img src={p.url} alt={p.name} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                                        <div style={{ padding: '6px', fontSize: '10px' }}>
                                          <div style={{ fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#fff' }}>{p.name.split('/').pop()}</div>
                                          <div style={{ color: '#9ca3af', marginTop: '2px' }}>Score: {p.quality_score}</div>
                                        </div>
                                        {isBest && (
                                          <span style={{ position: 'absolute', top: '4px', left: '4px', fontSize: '8px', background: 'var(--success)', color: '#fff', padding: '2px 4px', borderRadius: '3px', fontWeight: '700' }}>
                                            👍 KEEP BEST
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 4: chatbot Ask Agent Q&A Interface */}
                    {activeTab === 'ask' && (
                      <div style={{ height: '350px', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        {/* Messages panel */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {chatHistory.length === 0 ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#6b7280', fontSize: '12px', gap: '8px', textAlign: 'center' }}>
                              <span>💬 Ask questions like:</span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '400px', justifyContent: 'center' }}>
                                {[
                                  "Show me sunset photos",
                                  "Which photos are blurry?",
                                  "Do I have duplicates?",
                                  "What smart albums were created?"
                                ].map((q, idx) => (
                                  <button 
                                    key={idx}
                                    onClick={() => setQuestion(q)}
                                    style={{ background: 'rgba(255,255,255,0.04)', color: '#aaa', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}
                                  >
                                    "{q}"
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            chatHistory.map((msg, index) => (
                              <div 
                                key={index} 
                                style={{ 
                                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                  maxWidth: '85%',
                                  background: msg.sender === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                  borderRadius: '12px',
                                  padding: '10px 14px',
                                  border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)'
                                }}
                              >
                                <p style={{ fontSize: '13px', color: '#fff', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                                
                                {/* Sources display */}
                                {msg.sources && msg.sources.length > 0 && (
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                    {msg.sources.map(src => (
                                      <div 
                                        key={src.id} 
                                        className="glass-panel" 
                                        onClick={() => {
                                          const fullPhoto = photos.find(x => x.id === src.id);
                                          if (fullPhoto) setSelectedPhoto(fullPhoto);
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', background: 'rgba(0,0,0,0.2)' }}
                                      >
                                        <img src={src.url} alt={src.name} style={{ width: '20px', height: '20px', borderRadius: '3px', objectFit: 'cover' }} />
                                        <span style={{ fontSize: '10px', color: '#bbb' }}>{src.name.split('/').pop()}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <span style={{ display: 'block', fontSize: '9px', color: '#9ca3af', textAlign: 'right', marginTop: '4px' }}>
                                  {msg.timestamp}
                                </span>
                              </div>
                            ))
                          )}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Input form */}
                        <form onSubmit={handleAskQuestion} style={{ display: 'flex', borderTop: '1px solid var(--border-color)', padding: '8px' }}>
                          <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Ask a question about this collection..."
                            style={{ flex: 1, background: 'none', border: 'none', color: '#fff', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
                          />
                          <button
                            type="submit"
                            disabled={isAsking || !question.trim()}
                            className="glass-panel"
                            style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                          >
                            {isAsking ? '...' : 'Send'}
                          </button>
                        </form>
                      </div>
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

      {/* Footer */}
      <footer style={{ padding: '16px 24px', textAlign: 'center', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: '#6b7280' }}>
        PicsDrop AI &copy; 2026. Made with Google Gemini pairing.
      </footer>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px' }}>
            <h3 className="font-outfit" style={{ fontSize: '18px', color: '#fff', marginBottom: '16px' }}>Create New Collection</h3>
            <form onSubmit={handleCreateCollection} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#9ca3af' }}>Collection Name</label>
                <input
                  type="text"
                  required
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Hawaii Trip, Family Wedding"
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '13px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#9ca3af' }}>Description (Optional)</label>
                <textarea
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  placeholder="Summarize the events in this collection..."
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '13px', height: '80px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-panel"
                  style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Inspection Detail Modal */}
      {selectedPhoto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }} onClick={() => setSelectedPhoto(null)}>
          <div className="glass-panel" style={{ width: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '100%', maxHeight: '300px', background: '#0e1217', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
              <img src={selectedPhoto.url} alt={selectedPhoto.name} style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 className="font-outfit" style={{ fontSize: '18px', color: '#fff' }}>{selectedPhoto.name.split('/').pop()}</h3>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Type: {selectedPhoto.type} | Added: {new Date(selectedPhoto.registered_at).toLocaleDateString()}</span>
                </div>
                <button onClick={() => setSelectedPhoto(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '16px', cursor: 'pointer' }}>✕</button>
              </div>

              {selectedPhoto.status === 'analyzed' ? (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Caption */}
                  <div>
                    <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Generated Caption</h4>
                    <p style={{ fontSize: '13px', color: '#fff', marginTop: '4px', fontStyle: 'italic' }}>"{selectedPhoto.caption}"</p>
                  </div>

                  {/* Quality sliders */}
                  <div>
                    <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px', marginBottom: '6px' }}>Quality breakdown (Score: {selectedPhoto.quality_score})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sharpness:</span><span>{(selectedPhoto.quality_details.sharpness * 100).toFixed(0)}%</span></div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                          <div style={{ width: `${selectedPhoto.quality_details.sharpness * 100}%`, height: '100%', background: 'var(--primary)' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Composition:</span><span>{(selectedPhoto.quality_details.composition * 100).toFixed(0)}%</span></div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                          <div style={{ width: `${selectedPhoto.quality_details.composition * 100}%`, height: '100%', background: 'var(--accent)' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Lighting:</span><span>{(selectedPhoto.quality_details.lighting * 100).toFixed(0)}%</span></div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                          <div style={{ width: `${selectedPhoto.quality_details.lighting * 100}%`, height: '100%', background: 'var(--secondary)' }} />
                        </div>
                      </div>
                    </div>

                    {selectedPhoto.quality_details.issues.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--danger)', padding: '6px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.08)' }}>
                        <strong>Detected Issues:</strong> {selectedPhoto.quality_details.issues.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px', marginBottom: '6px' }}>Semantic Tags</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedPhoto.tags.map((t, i) => (
                        <span key={i} style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', color: '#ccc', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '2px 8px' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '20px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
                  Photo has not been analyzed yet. Click "🔮 Run AI Analysis" in the workspace to scan quality and extract semantic index.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
