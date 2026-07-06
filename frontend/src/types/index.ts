export interface Photo {
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

export interface Album {
  id: string;
  title: string;
  description: string;
  cover_photo_id: string;
  photo_ids: string[];
}

export interface PipelineLog {
  agent: string;
  message: string;
  status: string;
}

export interface ReelPhoto {
  photo_id: string;
  order: number;
  reason: string;
  overlay_text: string;
  duration_seconds: number;
  transition: string;
}

export interface ReelPlan {
  agent?: string;
  reel_title: string;
  reel_theme: string;
  music_mood: string;
  estimated_duration_seconds: number;
  story_arc: string[];
  selected_photos: ReelPhoto[];
  closing_caption: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  created_at: string;
  status: string;
  photos: Photo[];
  duplicate_groups: string[][];
  albums: Album[];
  reel_plan?: ReelPlan | null;
  logs?: PipelineLog[];
}

export interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  sources?: { id: string; name: string; url: string; caption: string }[];
  timestamp: string;
}

export type TabId = 'gallery' | 'albums' | 'duplicates' | 'reel' | 'ask';